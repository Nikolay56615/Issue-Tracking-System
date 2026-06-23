import type { IssueCustomFieldValue } from '@/features/board/model';
import {
  formatCustomFieldValue,
  getEnumOption,
  type CustomFieldDefinition,
} from '@/features/project-config/model';

interface EnumFieldBadgeProps {
  field: CustomFieldDefinition;
  value: IssueCustomFieldValue;
}

export const EnumFieldBadge = ({ field, value }: EnumFieldBadgeProps) => {
  const option = getEnumOption(field, value);

  if (!option) {
    return <>{formatCustomFieldValue(field, value)}</>;
  }

  return (
    <span
      className="inline-flex max-w-full items-center rounded-md border px-2 py-0.5
        text-xs font-medium"
      style={{
        borderColor: option.color,
        color: option.color,
      }}
    >
      {option.label}
    </span>
  );
};
