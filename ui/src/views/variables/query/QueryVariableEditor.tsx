import React, { ChangeEvent, PureComponent } from 'react';
import { InlineFormLabel, LegacyForms } from 'src/packages/datav-core/src/ui';

import templateSrv from 'src/core/services/templating';
import { SelectionOptionsEditor } from '../editor/SelectionOptionsEditor';
import { QueryVariableModel, VariableRefresh, VariableSort, VariableWithMultiSupport } from 'src/types';
import { QueryVariableEditorState } from './reducer';
import { changeQueryVariableDataSource, changeQueryVariableQuery, initQueryVariableEditor } from './actions';
import { VariableEditorState } from '../editor/reducer';
import { OnPropChangeArguments, VariableEditorProps } from '../editor/types';
import { MapDispatchToProps, MapStateToProps } from 'react-redux';
import { StoreState } from '../../../types';
import { connectWithStore } from 'src/core/library/utils/connectWithReduxStore';
import { toVariableIdentifier } from '../state/types';
import { changeVariableMultiValue } from '../state/actions';
import { FormattedMessage } from 'react-intl';
import localeData from 'src/core/library/locale'

const { Switch } = LegacyForms;

export interface OwnProps extends VariableEditorProps<QueryVariableModel> {}

interface ConnectedProps {
  locale: string
  editor: VariableEditorState<QueryVariableEditorState>;
}

interface DispatchProps {
  initQueryVariableEditor: typeof initQueryVariableEditor;
  changeQueryVariableDataSource: typeof changeQueryVariableDataSource;
  changeQueryVariableQuery: typeof changeQueryVariableQuery;
  changeVariableMultiValue: typeof changeVariableMultiValue;
}

type Props = OwnProps & ConnectedProps & DispatchProps;

export interface State {
  regex: string | null;
  tagsQuery: string | null;
  tagValuesQuery: string | null;
}

export class QueryVariableEditorUnConnected extends PureComponent<Props, State> {
  state: State = {
    regex: null,
    tagsQuery: null,
    tagValuesQuery: null,
  };

  async componentDidMount() {
    await this.props.initQueryVariableEditor(toVariableIdentifier(this.props.variable));
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.variable.datasource !== this.props.variable.datasource) {
      this.props.changeQueryVariableDataSource(
        toVariableIdentifier(this.props.variable),
        this.props.variable.datasource
      );
    }
  }

  getSelectedDataSourceValue = (): string => {
    if (!this.props.editor.extended?.dataSources.length) {
      return '';
    }
    const foundItem = this.props.editor.extended?.dataSources.find(ds => ds.value === this.props.variable.datasource);
    const value = foundItem ? foundItem.value : this.props.editor.extended?.dataSources[0].value;
    return value ?? '';
  };

  onDataSourceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    this.props.onPropChange({ propName: 'query', propValue: '' });
    this.props.onPropChange({ propName: 'datasource', propValue: event.target.value });
  };

  onQueryChange = async (query: any, definition: string) => {
    this.props.changeQueryVariableQuery(toVariableIdentifier(this.props.variable), query, definition);
  };

  onRegExChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ regex: event.target.value });
  };

  onRegExBlur = async (event: ChangeEvent<HTMLInputElement>) => {
    this.props.onPropChange({ propName: 'regex', propValue: event.target.value, updateOptions: true });
  };

  onTagsQueryChange = async (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ tagsQuery: event.target.value });
  };

  onTagsQueryBlur = async (event: ChangeEvent<HTMLInputElement>) => {
    this.props.onPropChange({ propName: 'tagsQuery', propValue: event.target.value, updateOptions: true });
  };

  onTagValuesQueryChange = async (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ tagValuesQuery: event.target.value });
  };

  onTagValuesQueryBlur = async (event: ChangeEvent<HTMLInputElement>) => {
    this.props.onPropChange({ propName: 'tagValuesQuery', propValue: event.target.value, updateOptions: true });
  };

  onRefreshChange = (event: ChangeEvent<HTMLSelectElement>) => {
    this.props.onPropChange({ propName: 'refresh', propValue: parseInt(event.target.value, 10) });
  };

  onSortChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    this.props.onPropChange({ propName: 'sort', propValue: parseInt(event.target.value, 10), updateOptions: true });
  };

  onSelectionOptionsChange = async ({ propValue, propName }: OnPropChangeArguments<VariableWithMultiSupport>) => {
    this.props.onPropChange({ propName, propValue, updateOptions: true });
  };

  onUseTagsChange = async (event: ChangeEvent<HTMLInputElement>) => {
    this.props.onPropChange({ propName: 'useTags', propValue: event.target.checked, updateOptions: true });
  };

  render() {
    const VariableQueryEditor = this.props.editor.extended?.VariableQueryEditor;
    return (
      <>
        <div className="gf-form-group">
          <h5 className="section-heading"><FormattedMessage id="dashboard.queryOptions" /></h5>
          <div className="gf-form-inline">
            <div className="gf-form max-width-21">
              <span className="gf-form-label width-10"><FormattedMessage id="common.datasource" /></span>
              <div className="gf-form-select-wrapper max-width-14">
                <select
                  className="gf-form-input"
                  value={this.getSelectedDataSourceValue()}
                  onChange={this.onDataSourceChange}
                  required
                >
                  {this.props.editor.extended?.dataSources.length &&
                    this.props.editor.extended?.dataSources.map(ds => (
                      <option key={ds.value ?? ''} value={ds.value ?? ''} label={ds.name}>
                        {ds.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="gf-form max-width-22">
              <InlineFormLabel width={10} tooltip={<FormattedMessage id="dashboard.variableRefresh" />}>
              <FormattedMessage id="common.refresh" />
              </InlineFormLabel>
              <div className="gf-form-select-wrapper width-15">
                <select
                  className="gf-form-input"
                  value={this.props.variable.refresh}
                  onChange={this.onRefreshChange}
                >
                  <option label={localeData[this.props.locale]['common.never']} value={VariableRefresh.never}>
                    Never
                  </option>
                  <option label={localeData[this.props.locale]['dashboard.onDashLoad']} value={VariableRefresh.onDashboardLoad}>
                    On Dashboard Load
                  </option>
                  <option label={localeData[this.props.locale]['dashboard.onTimeChange']}  value={VariableRefresh.onTimeRangeChanged}>
                    On Time Range Change
                  </option>
                </select>
              </div>
            </div>
          </div>

          {VariableQueryEditor && this.props.editor.extended?.dataSource && (
            <VariableQueryEditor
              datasource={this.props.editor.extended?.dataSource}
              query={this.props.variable.query}
              templateSrv={templateSrv}
              onChange={this.onQueryChange}
            />
          )}

          <div className="gf-form">
            <InlineFormLabel
              width={10}
              tooltip={<FormattedMessage id="dashboard.variableRegexTooltip" />}
            >
              <FormattedMessage id="common.regex" />
            </InlineFormLabel>
            <input
              type="text"
              className="gf-form-input"
              placeholder="/.*-(.*)-.*/"
              value={this.state.regex ?? this.props.variable.regex}
              onChange={this.onRegExChange}
              onBlur={this.onRegExBlur}
            />
          </div>
          <div className="gf-form max-width-21">
            <InlineFormLabel width={10} tooltip={<FormattedMessage id="dashboard.variableSortTooltip" />}>
              <FormattedMessage id="common.sort" />
            </InlineFormLabel>
            <div className="gf-form-select-wrapper max-width-14">
              <select
                className="gf-form-input"
                value={this.props.variable.sort}
                onChange={this.onSortChange}
              >
                <option label="Disabled" value={VariableSort.disabled}>
                  Disabled
                </option>
                <option label="Alphabetical (asc)" value={VariableSort.alphabeticalAsc}>
                  Alphabetical (asc)
                </option>
                <option label="Alphabetical (desc)" value={VariableSort.alphabeticalDesc}>
                  Alphabetical (desc)
                </option>
                <option label="Numerical (asc)" value={VariableSort.numericalAsc}>
                  Numerical (asc)
                </option>
                <option label="Numerical (desc)" value={VariableSort.numericalDesc}>
                  Numerical (desc)
                </option>
                <option
                  label="Alphabetical (case-insensitive, asc)"
                  value={VariableSort.alphabeticalCaseInsensitiveAsc}
                >
                  Alphabetical (case-insensitive, asc)
                </option>
                <option
                  label="Alphabetical (case-insensitive, desc)"
                  value={VariableSort.alphabeticalCaseInsensitiveDesc}
                >
                  Alphabetical (case-insensitive, desc)
                </option>
              </select>
            </div>
          </div>
        </div>

        <SelectionOptionsEditor
          variable={this.props.variable}
          onPropChange={this.onSelectionOptionsChange}
          onMultiChanged={this.props.changeVariableMultiValue}
        />

        {/* <div className="gf-form-group">
          <h5>Value groups/tags (Experimental feature)</h5>
          <div>
            <LegacySwitch
              label="Enabled"
              label-class="width-10"
              checked={this.props.variable.useTags}
              onChange={this.onUseTagsChange}
            />
          </div>
          {this.props.variable.useTags && (
            <>
              <div className="gf-form last">
                <span className="gf-form-label width-10">Tags query</span>
                <input
                  type="text"
                  className="gf-form-input"
                  value={this.state.tagsQuery ?? this.props.variable.tagsQuery}
                  placeholder="metric name or tags query"
                  onChange={this.onTagsQueryChange}
                  onBlur={this.onTagsQueryBlur}
                />
              </div>
              <div className="gf-form">
                <li className="gf-form-label width-10">Tag values query</li>
                <input
                  type="text"
                  className="gf-form-input"
                  value={this.state.tagValuesQuery ?? this.props.variable.tagValuesQuery}
                  placeholder="apps.$tag.*"
                  onChange={this.onTagValuesQueryChange}
                  onBlur={this.onTagValuesQueryBlur}
                />
              </div>
            </>
          )}
        </div> */}
      </>
    );
  }
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state, ownProps) => ({
  editor: state.templating.editor as VariableEditorState<QueryVariableEditorState>,
  locale: state.application.locale
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = {
  initQueryVariableEditor,
  changeQueryVariableDataSource,
  changeQueryVariableQuery,
  changeVariableMultiValue,
};

export const QueryVariableEditor = connectWithStore(
  QueryVariableEditorUnConnected,
  mapStateToProps,
  mapDispatchToProps
);
