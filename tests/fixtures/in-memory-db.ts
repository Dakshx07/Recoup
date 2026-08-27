import { SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseState {
  invoices: any[];
  recovery_cases: any[];
  commitments: any[];
  payment_links: any[];
  payments: any[];
  audit_events: any[];
  debtor_replies: any[];
  reply_parses: any[];
  outreach_messages: any[];
  webhook_events: any[];
}

export function createInMemoryDatabase(initialState: Partial<DatabaseState> = {}): {
  state: DatabaseState;
  client: SupabaseClient;
} {
  const state: DatabaseState = {
    invoices: [...(initialState.invoices || [])],
    recovery_cases: [...(initialState.recovery_cases || [])],
    commitments: [...(initialState.commitments || [])],
    payment_links: [...(initialState.payment_links || [])],
    payments: [...(initialState.payments || [])],
    audit_events: [...(initialState.audit_events || [])],
    debtor_replies: [...(initialState.debtor_replies || [])],
    reply_parses: [...(initialState.reply_parses || [])],
    outreach_messages: [...(initialState.outreach_messages || [])],
    webhook_events: [...(initialState.webhook_events || [])],
  };

  function createTableQuery(tableName: keyof DatabaseState) {
    let filters: Array<(row: any) => boolean> = [];
    let orderField: string | null = null;
    let orderAsc: boolean = true;
    let limitCount: number | null = null;
    let isSingle: boolean = false;

    const builder: any = {
      select: (fields?: string) => {
        return builder;
      },
      eq: (field: string, value: any) => {
        filters.push((row) => row[field] === value);
        return builder;
      },
      lt: (field: string, value: any) => {
        filters.push((row) => {
          const rowVal = new Date(row[field]).getTime();
          const targetVal = new Date(value).getTime();
          return rowVal < targetVal;
        });
        return builder;
      },
      not: (field: string, operator: string, value: string) => {
        if (operator === 'in') {
          const cleaned = value.replace(/[()]/g, '').split(',').map((s) => s.trim());
          filters.push((row) => !cleaned.includes(row[field]));
        }
        return builder;
      },
      order: (field: string, opts?: { ascending?: boolean }) => {
        orderField = field;
        orderAsc = opts?.ascending !== false;
        return builder;
      },
      limit: (count: number) => {
        limitCount = count;
        return builder;
      },
      single: async () => {
        isSingle = true;
        return builder.then((res: any) => res);
      },
      insert: async (rows: any | any[]) => {
        const rowsArray = Array.isArray(rows) ? rows : [rows];
        const inserted: any[] = [];

        for (const row of rowsArray) {
          // Check unique constraints
          if (tableName === 'payments' && row.external_payment_id) {
            const exists = state.payments.some(
              (p) => p.external_payment_id === row.external_payment_id
            );
            if (exists) {
              return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
            }
          }
          if (tableName === 'webhook_events' && row.source && row.event_id) {
            const exists = state.webhook_events.some(
              (w) => w.source === row.source && w.event_id === row.event_id
            );
            if (exists) {
              return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
            }
          }

          const newRow = {
            id: row.id || `gen_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            created_at: row.created_at || new Date().toISOString(),
            ...row,
          };
          state[tableName].push(newRow);
          inserted.push(newRow);
        }

        return {
          data: isSingle ? inserted[0] : inserted,
          error: null,
          select: () => ({
            single: async () => ({ data: inserted[0], error: null }),
          }),
        };
      },
      update: (updates: any) => {
        return {
          eq: (field1: string, val1: any) => {
            const updateFilters = [(row: any) => row[field1] === val1];
            const executeUpdate = async () => {
              const matchedRows = state[tableName].filter((row) =>
                updateFilters.every((f) => f(row))
              );
              matchedRows.forEach((row) => {
                Object.assign(row, updates);
              });
              return { data: matchedRows, error: null };
            };

            const chained: any = {
              eq: (field2: string, val2: any) => {
                updateFilters.push((row: any) => row[field2] === val2);
                return chained;
              },
              select: async () => {
                return executeUpdate();
              },
              then: (resolve: any, reject: any) => {
                return executeUpdate().then(resolve, reject);
              },
            };

            return chained;
          },
        };
      },
      then: async (resolve: any) => {
        let rows = state[tableName].filter((row) => filters.every((f) => f(row)));

        // Handle relational population for recovery_cases & invoices
        if (tableName === 'payment_links') {
          rows = rows.map((pl) => {
            const inv = state.invoices.find((i) => i.id === pl.invoice_id);
            const cases = state.recovery_cases.filter((c) => c.invoice_id === pl.invoice_id);
            return {
              ...pl,
              invoices: inv ? { ...inv, recovery_cases: cases } : null,
            };
          });
        } else if (tableName === 'recovery_cases') {
          rows = rows.map((c) => {
            const inv = state.invoices.find((i) => i.id === c.invoice_id);
            return {
              ...c,
              invoices: inv || null,
            };
          });
        }

        if (orderField) {
          const field = orderField;
          rows.sort((a, b) => {
            if (a[field] < b[field]) return orderAsc ? -1 : 1;
            if (a[field] > b[field]) return orderAsc ? 1 : -1;
            return 0;
          });
        }

        if (limitCount !== null) {
          rows = rows.slice(0, limitCount);
        }

        if (isSingle) {
          const singleRow = rows[0] || null;
          return resolve({ data: singleRow, error: singleRow ? null : { message: 'Row not found' } });
        }

        return resolve({ data: rows, error: null });
      },
    };

    return builder;
  }

  const mockClient: any = {
    from: (tableName: keyof DatabaseState) => createTableQuery(tableName),
  };

  return { state, client: mockClient as SupabaseClient };
}
