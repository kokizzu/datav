import React, { useCallback } from 'react';
import { DataTransformerID, standardTransformers, TransformerRegistryItem, TransformerUIProps } from 'src/packages/datav-core/src/data';
import { InlineField, InlineSwitch, InlineFieldRow, Select } from 'src/packages/datav-core/src/ui';
import { SortByField, SortByTransformerOptions } from 'src/packages/datav-core/src/data/transformations/transformers/sortBy';
import { useAllFieldNamesFromDataFrames } from './utils';

export const SortByTransformerEditor: React.FC<TransformerUIProps<SortByTransformerOptions>> = ({
  input,
  options,
  onChange,
}) => {
  const fieldNames = useAllFieldNamesFromDataFrames(input).map((item: string) => ({ label: item, value: item }));

  // Only supports single sort for now
  const onSortChange = useCallback(
    (idx: number, cfg: SortByField) => {
      onChange({ ...options, sort: [cfg] });
    },
    [onChange, options]
  );

  const sorts = options.sort?.length ? options.sort : [{} as SortByField];

  return (
    <div>
      {sorts.map((s, index) => {
        return (
          <InlineFieldRow key={`${s.field}/${index}`}>
            <InlineField label="Field" labelWidth={10} grow={true}>
              <Select
                menuShouldPortal
                options={fieldNames}
                value={s.field}
                placeholder="Select field"
                onChange={(v) => {
                  onSortChange(index, { ...s, field: v.value! });
                }}
              />
            </InlineField>
            <InlineField label="Reverse">
              <InlineSwitch
                value={!!s.desc}
                onChange={() => {
                  onSortChange(index, { ...s, desc: !!!s.desc });
                }}
              />
            </InlineField>
          </InlineFieldRow>
        );
      })}
    </div>
  );
};

export const sortByTransformRegistryItem: TransformerRegistryItem<SortByTransformerOptions> = {
  id: DataTransformerID.sortBy,
  editor: SortByTransformerEditor,
  transformation: standardTransformers.sortByTransformer,
  name: standardTransformers.sortByTransformer.name,
  description: standardTransformers.sortByTransformer.description,
};
