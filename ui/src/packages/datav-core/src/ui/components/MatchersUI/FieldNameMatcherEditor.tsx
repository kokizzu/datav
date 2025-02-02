import React, { memo, useCallback } from 'react';
import { MatcherUIProps, FieldMatcherUIRegistryItem } from './types';
import { FieldMatcherID, fieldMatchers, SelectableValue } from '../../../data';
import { Select } from '../Select/Select';
import { useFieldDisplayNames, useSelectOptions, frameHasName } from './utils';

export const FieldNameMatcherEditor = memo<MatcherUIProps<string>>((props) => {
  const { data, options, onChange: onChangeFromProps } = props;
  const names = useFieldDisplayNames(data);
  const selectOptions = useSelectOptions(names, options);

  const onChange = useCallback(
    (selection: SelectableValue<string>) => {
      if (!frameHasName(selection.value, names)) {
        return;
      }
      return onChangeFromProps(selection.value!);
    },
    [names, onChangeFromProps]
  );

  const selectedOption = selectOptions.find((v) => v.value === options);
  return <Select menuShouldPortal value={selectedOption} options={selectOptions} onChange={onChange} />;
});
FieldNameMatcherEditor.displayName = 'FieldNameMatcherEditor';

export const fieldNameMatcherItem: FieldMatcherUIRegistryItem<string> = {
  id: FieldMatcherID.byName,
  component: FieldNameMatcherEditor,
  matcher: fieldMatchers.get(FieldMatcherID.byName),
  name: 'Fields with name',
  description: 'Set properties for a specific field',
  optionsToLabel: (options) => options,
};
