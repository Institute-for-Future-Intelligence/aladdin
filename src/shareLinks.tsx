/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import {
  FacebookIcon,
  FacebookShareButton,
  LineIcon,
  LineShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from 'react-share';

const ShareLinkContainer = styled.div`
  z-index: 999;
`;

export interface ShareLinkProps {
  url: string;
  title: string;
  style?: object;
  size: number;
  margin: string;
  round?: boolean;
  handleShareWindowClose?: () => void;
}

const ShareLinks = ({ url, title, style, size, margin, round, handleShareWindowClose }: ShareLinkProps) => {
  return (
    <ShareLinkContainer style={style}>
      <TwitterShareButton
        url={url}
        title={title}
        style={{ paddingRight: margin }}
        onShareWindowClose={handleShareWindowClose}
      >
        <TwitterIcon size={size} round={round} />
      </TwitterShareButton>
      <FacebookShareButton
        url={url}
        quote={title}
        style={{ paddingRight: margin }}
        onShareWindowClose={handleShareWindowClose}
      >
        <FacebookIcon size={size} round={round} />
      </FacebookShareButton>
      <RedditShareButton
        url={url}
        title={title}
        style={{ paddingRight: margin }}
        onShareWindowClose={handleShareWindowClose}
      >
        <RedditIcon size={size} round={round} />
      </RedditShareButton>
      <LineShareButton
        url={url}
        title={title}
        style={{ paddingRight: margin }}
        onShareWindowClose={handleShareWindowClose}
      >
        <LineIcon size={size} round={round} />
      </LineShareButton>
      <LinkedinShareButton
        url={url}
        title={title}
        style={{ paddingRight: margin }}
        onShareWindowClose={handleShareWindowClose}
      >
        <LinkedinIcon size={size} round={round} />
      </LinkedinShareButton>
      <WhatsappShareButton url={url} title={title} onShareWindowClose={handleShareWindowClose}>
        <WhatsappIcon size={size} round={round} />
      </WhatsappShareButton>
    </ShareLinkContainer>
  );
};

export default React.memo(ShareLinks);
