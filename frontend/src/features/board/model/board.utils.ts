import type { IssueCustomFieldValue, IssueFilters } from './board.types.ts';

const normalizeArray = <T extends string>(value: T[] | undefined) =>
  value ? [...value].sort() : [];

const normalizeCustomFields = (
  customFields: Record<string, IssueCustomFieldValue> | undefined
) =>
  Object.fromEntries(
    Object.entries(customFields ?? {}).sort(([left], [right]) =>
      left.localeCompare(right)
    )
  );

export const getIssueFiltersKey = (
  filters: IssueFilters | undefined,
  { includeNameQuery = true }: { includeNameQuery?: boolean } = {}
) =>
  JSON.stringify({
    types: normalizeArray(filters?.types),
    priorities: normalizeArray(filters?.priorities),
    assigneeId: filters?.assigneeId ?? null,
    nameQuery: includeNameQuery ? (filters?.nameQuery ?? '') : '',
    dateFrom: filters?.dateFrom ?? null,
    dateTo: filters?.dateTo ?? null,
    customFields: normalizeCustomFields(filters?.customFields),
  });
