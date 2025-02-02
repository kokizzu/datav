/*eslint-disable*/
import React, { PureComponent } from 'react';
import { Icon, Tooltip } from 'src/packages/datav-core/src/ui';
import { textUtil} from 'src/packages/datav-core/src';

import { getBackendSrv } from 'src/core/services/backend/backend';
import { getLinkSrv } from 'src/core/services/link';
import { DashboardLink } from '../../model/DashboardModel';
import { DashboardSearchHit } from 'src/types';

const { sanitize, sanitizeUrl } = textUtil

interface Props {
  link: DashboardLink;
  linkInfo: { title: string; href: string };
  dashboardId: any;
}

interface State {
  resolvedLinks: ResolvedLinkDTO[];
}

export class DashboardLinksDashboard extends PureComponent<Props, State> {
  state: State = { resolvedLinks: [] };

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (!this.props.link.asDropdown && prevProps.linkInfo !== this.props.linkInfo) {
      this.onResolveLinks();
    }
  }

  onResolveLinks = async () => {
    const { dashboardId, link } = this.props;

    const searchHits = await searchForTags(link);
    const resolvedLinks = resolveLinks(dashboardId, link, searchHits);

    this.setState({ resolvedLinks });
  };

  renderElement = (linkElement: JSX.Element, key: string) => {
    const { link } = this.props;

    return (
      <div className="gf-form" key={key}>
        {link.tooltip && <Tooltip content={link.tooltip}>{linkElement}</Tooltip>}
        {!link.tooltip && <>{linkElement}</>}
      </div>
    );
  };

  renderList = () => {
    const { link } = this.props;
    const { resolvedLinks } = this.state;

    return (
      <>
        {resolvedLinks.length > 0 &&
          resolvedLinks.map((resolvedLink, index) => {
            const linkElement = (
              <a className="gf-form-label" href={resolvedLink.url} target={link.targetBlank ? '_blank' : '_self'}>
                <Icon name="apps" style={{ marginRight: '4px' }} />
                <span>{resolvedLink.title}</span>
              </a>
            );
            return this.renderElement(linkElement, `dashlinks-list-item-${resolvedLink.id}-${index}`);
          })}
      </>
    );
  };

  renderDropdown = () => {
    const { link, linkInfo } = this.props;
    const { resolvedLinks } = this.state;

    const linkElement = (
      <>
        <a
          className="gf-form-label pointer"
          onClick={this.onResolveLinks}
          data-placement="bottom"
          data-toggle="dropdown"
        >
          <Icon name="bars" />
          <span>{linkInfo.title}</span>
        </a>
        <ul className="dropdown-menu pull-right" role="menu">
          {resolvedLinks.length > 0 &&
            resolvedLinks.map((resolvedLink, index) => {
              return (
                <li key={`dashlinks-dropdown-item-${resolvedLink.id}-${index}`}>
                  <a href={resolvedLink.url} target={link.targetBlank ? '_blank' : '_self'}>
                    {resolvedLink.title}
                  </a>
                </li>
              );
            })}
        </ul>
      </>
    );

    return this.renderElement(linkElement, 'dashlinks-dropdown');
  };

  render() {
    if (this.props.link.asDropdown) {
      return this.renderDropdown();
    }

    return this.renderList();
  }
}

interface ResolvedLinkDTO {
  id: any;
  url: string;
  title: string;
}

export async function searchForTags(
  link: DashboardLink,
  dependencies: { getBackendSrv: typeof getBackendSrv } = { getBackendSrv }
): Promise<DashboardSearchHit[]> {
  const limit = 100;
  const searchHits: DashboardSearchHit[] = await dependencies.getBackendSrv().search({ tag: link.tags, limit });

  return searchHits;
}

export function resolveLinks(
  dashboardId: any,
  link: DashboardLink,
  searchHits: DashboardSearchHit[],
  dependencies: { getLinkSrv: typeof getLinkSrv; sanitize: typeof sanitize; sanitizeUrl: typeof sanitizeUrl } = {
    getLinkSrv,
    sanitize,
    sanitizeUrl,
  }
): ResolvedLinkDTO[] {
  return searchHits
    .filter(searchHit => searchHit.id !== dashboardId)
    .map(searchHit => {
      const id = searchHit.id;
      const title = dependencies.sanitize(searchHit.title);
      const resolvedLink = dependencies.getLinkSrv().getLinkUrl({ ...link, url: searchHit.url });
      const url = dependencies.sanitizeUrl(resolvedLink);

      return { id, title, url };
    });
}
