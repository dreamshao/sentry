import React from 'react';
import styled from '@emotion/styled';
import * as Sentry from '@sentry/react';

import {addErrorMessage} from 'app/actionCreators/indicator';
import Button from 'app/components/button';
import SelectControl from 'app/components/forms/selectControl';
import LoadingIndicator from 'app/components/loadingIndicator';
import {Panel, PanelBody, PanelHeader, PanelItem} from 'app/components/panels';
import {IconAdd} from 'app/icons';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {Organization, Project, SelectValue} from 'app/types';
import {removeAtArrayIndex} from 'app/utils/removeAtArrayIndex';
import {replaceAtArrayIndex} from 'app/utils/replaceAtArrayIndex';
import withOrganization from 'app/utils/withOrganization';
import FieldHelp from 'app/views/settings/components/forms/field/fieldHelp';
import FieldLabel from 'app/views/settings/components/forms/field/fieldLabel';
import ActionTargetSelector from 'app/views/settings/incidentRules/triggers/actionsPanel/actionTargetSelector';
import DeleteActionButton from 'app/views/settings/incidentRules/triggers/actionsPanel/deleteActionButton';
import {
  Action,
  ActionType,
  MetricActionTemplate,
  TargetType,
  Trigger,
} from 'app/views/settings/incidentRules/types';

const ActionLabel = {
  [ActionType.EMAIL]: t('E-mail'),
  [ActionType.SLACK]: t('Slack'),
  [ActionType.PAGERDUTY]: t('Pagerduty'),
  [ActionType.MSTEAMS]: t('Microsoft Teams'),
};

const TargetLabel = {
  [TargetType.USER]: t('Member'),
  [TargetType.TEAM]: t('Team'),
};

type Props = {
  availableActions: MetricActionTemplate[] | null;
  currentProject: string;
  organization: Organization;
  projects: Project[];
  disabled: boolean;
  loading: boolean;
  error: boolean;

  triggers: Trigger[];
  className?: string;
  onAdd: (triggerIndex: number, action: Action) => void;
  onChange: (triggerIndex: number, triggers: Trigger[], actions: Action[]) => void;
};

/**
 * When a new action is added, all of it's settings should be set to their default values.
 * @param actionConfig
 */
const getCleanAction = (actionConfig): Action => {
  return {
    type: actionConfig.type,
    targetType:
      actionConfig &&
      actionConfig.allowedTargetTypes &&
      actionConfig.allowedTargetTypes.length > 0
        ? actionConfig.allowedTargetTypes[0]
        : null,
    targetIdentifier: '',
    integrationId: actionConfig.integrationId,
    options: actionConfig.options || null,
  };
};

/**
 * Actions have a type (e.g. email, slack, etc), but only some have
 * an integrationId (e.g. email is null). This helper creates a unique
 * id based on the type and integrationId so that we know what action
 * a user's saved action corresponds to.
 */
const getActionUniqueKey = ({
  type,
  integrationId,
}: Pick<Action, 'type' | 'integrationId'>) => {
  if (integrationId) {
    return `${type}-${integrationId}`;
  }
  return type;
};

/**
 * Creates a human-friendly display name for the integration based on type and
 * server provided `integrationName`
 *
 * e.g. for slack we show that it is slack and the `integrationName` is the workspace name
 */
const getFullActionTitle = ({
  type,
  integrationName,
}: Pick<MetricActionTemplate, 'type' | 'integrationName'>) => {
  const label = ActionLabel[type];
  if (integrationName) {
    return `${label} - ${integrationName}`;
  }
  return label;
};

/**
 * Lists saved actions as well as control to add a new action
 */
class ActionsPanel extends React.PureComponent<Props> {
  handleChangeTargetIdentifier(triggerIndex: number, index: number, value: string) {
    const {triggers, onChange} = this.props;
    const {actions} = triggers[triggerIndex];
    const newAction = {
      ...actions[index],
      targetIdentifier: value,
    };

    onChange(triggerIndex, triggers, replaceAtArrayIndex(actions, index, newAction));
  }

  handleAddAction = () => {
    const {availableActions, onAdd} = this.props;
    const actionConfig = availableActions?.[0];

    if (!actionConfig) {
      addErrorMessage(t('There was a problem adding an action'));
      Sentry.captureException(new Error('Unable to add an action'));
      return;
    }

    const action: Action = getCleanAction(actionConfig);

    // Add new actions to critical by default
    const triggerIndex = 0;
    onAdd(triggerIndex, action);
  };

  handleDeleteAction = (triggerIndex: number, index: number) => {
    const {triggers, onChange} = this.props;
    const {actions} = triggers[triggerIndex];

    onChange(triggerIndex, triggers, removeAtArrayIndex(actions, index));
  };

  handleChangeActionLevel = (
    triggerIndex: number,
    index: number,
    value: SelectValue<number>
  ) => {
    const {triggers, onChange} = this.props;
    const action = triggers[triggerIndex].actions[index];

    // Because we're moving it between two different triggers the position of the
    // action could change, try to change it less by pushing or unshifting
    const position = value.value === 1 ? 'unshift' : 'push';
    triggers[value.value].actions[position](action);
    onChange(value.value, triggers, triggers[value.value].actions);
    this.handleDeleteAction(triggerIndex, index);
  };

  handleChangeActionType = (
    triggerIndex: number,
    index: number,
    value: SelectValue<ActionType>
  ) => {
    const {triggers, onChange, availableActions} = this.props;
    const {actions} = triggers[triggerIndex];
    const actionConfig = availableActions?.find(
      availableAction => getActionUniqueKey(availableAction) === value.value
    );
    if (!actionConfig) {
      addErrorMessage(t('There was a problem changing an action'));
      Sentry.captureException(new Error('Unable to change an action type'));
      return;
    }

    const newAction: Action = getCleanAction(actionConfig);
    onChange(triggerIndex, triggers, replaceAtArrayIndex(actions, index, newAction));
  };

  handleChangeTarget = (
    triggerIndex: number,
    index: number,
    value: SelectValue<keyof typeof TargetLabel>
  ) => {
    const {triggers, onChange} = this.props;
    const {actions} = triggers[triggerIndex];
    const newAction = {
      ...actions[index],
      targetType: value.value,
      targetIdentifier: '',
    };

    onChange(triggerIndex, triggers, replaceAtArrayIndex(actions, index, newAction));
  };

  render() {
    const {
      availableActions,
      currentProject,
      disabled,
      loading,
      organization,
      projects,
      triggers,
    } = this.props;

    const project = projects.find(({slug}) => slug === currentProject);
    const items =
      availableActions &&
      availableActions.map(availableAction => ({
        value: getActionUniqueKey(availableAction),
        label: getFullActionTitle(availableAction),
      }));

    const levels = [
      {value: 0, label: 'Critical Status'},
      {value: 1, label: 'Warning Status'},
    ];

    return (
      <Panel>
        <PanelHeader>{t('Actions')}</PanelHeader>
        <PanelBody withPadding>
          <FieldLabel>{t('Add an action')}</FieldLabel>
          <FieldHelp>
            {t(
              'We can send you an email or activate an integration when any of the thresholds above are met.'
            )}
          </FieldHelp>
        </PanelBody>
        <PanelBody>
          {loading && <LoadingIndicator />}
          {triggers.map((trigger, triggerIndex) => {
            const {actions} = trigger;
            return (
              actions &&
              actions.map((action: Action, i: number) => {
                const availableAction = availableActions?.find(
                  a => getActionUniqueKey(a) === getActionUniqueKey(action)
                );

                return (
                  <PanelItemGrid key={i}>
                    <SelectControl
                      name="select-level"
                      aria-label={t('Select a status level')}
                      isDisabled={disabled || loading}
                      placeholder={t('Select Level')}
                      onChange={this.handleChangeActionLevel.bind(this, triggerIndex, i)}
                      value={triggerIndex}
                      options={levels}
                    />

                    <SelectControl
                      name="select-action"
                      aria-label={t('Select an Action')}
                      isDisabled={disabled || loading}
                      placeholder={t('Select Action')}
                      onChange={this.handleChangeActionType.bind(this, triggerIndex, i)}
                      value={getActionUniqueKey(action)}
                      options={items ?? []}
                    />

                    {availableAction && availableAction.allowedTargetTypes.length > 1 ? (
                      <SelectControl
                        isDisabled={disabled || loading}
                        value={action.targetType}
                        options={availableAction?.allowedTargetTypes?.map(
                          allowedType => ({
                            value: allowedType,
                            label: TargetLabel[allowedType],
                          })
                        )}
                        onChange={this.handleChangeTarget.bind(this, triggerIndex, i)}
                      />
                    ) : (
                      <span />
                    )}
                    <ActionTargetSelector
                      action={action}
                      availableAction={availableAction}
                      disabled={disabled}
                      loading={loading}
                      onChange={this.handleChangeTargetIdentifier.bind(
                        this,
                        triggerIndex,
                        i
                      )}
                      organization={organization}
                      project={project}
                    />
                    <DeleteActionButton
                      triggerIndex={triggerIndex}
                      index={i}
                      onClick={this.handleDeleteAction}
                      disabled={disabled}
                    />
                  </PanelItemGrid>
                );
              })
            );
          })}
          <StyledPanelItem>
            <Button
              type="button"
              disabled={disabled || loading}
              size="small"
              icon={<IconAdd isCircled color="gray500" />}
              onClick={this.handleAddAction}
            >
              Add Item
            </Button>
          </StyledPanelItem>
        </PanelBody>
      </Panel>
    );
  }
}

const ActionsPanelWithSpace = styled(ActionsPanel)`
  margin-top: ${space(4)};
`;

const PanelItemGrid = styled(PanelItem)`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr min-content;
  align-items: center;
  grid-gap: ${space(2)};
  padding: ${space(0.5)} ${space(2)} ${space(1)};
  border-bottom: 0;
`;

const StyledPanelItem = styled(PanelItem)`
  padding: ${space(1)} ${space(2)} ${space(2)};
`;

export default withOrganization(ActionsPanelWithSpace);
