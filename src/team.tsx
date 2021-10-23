/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';

export interface TeamProps {
  top: number;
  height?: number;
  color?: string;
}

const Team = ({ top, height, color }: TeamProps) => {
  const linePos = top + 56 + 'px';
  const top110 = top + 110 + 'px';
  const top250 = top + 220 + 'px';
  return (
    <div>
      <div
        style={{
          position: 'absolute',
          borderRadius: '20px',
          border: 'thin',
          textAlign: 'center',
          left: '15%',
          right: '15%',
          top: top + 'px',
          height: (height ?? 300) + 'px',
        }}
      >
        <h2 style={{ marginTop: '20px', color: color }}>This product is brought to you by</h2>
        <p style={{ fontSize: '12px', color: color }}>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://intofuture.org/aladdin-terms.html"
            style={{ color: color }}
          >
            Terms of Service
          </a>
          &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://intofuture.org/aladdin-privacy.html"
            style={{ color: color }}
          >
            Privacy Policy
          </a>
        </p>
      </div>
      <div>
        <hr
          style={{
            position: 'absolute',
            left: '10%',
            width: '80%',
            marginTop: linePos,
            color: color,
          }}
        />
        <table
          style={{
            position: 'absolute',
            border: 'none',
            top: top110,
            left: '10%',
            width: '80%',
            fontSize: 'small',
            color: color,
          }}
        >
          <tbody>
            <tr
              style={{
                verticalAlign: 'top',
              }}
            >
              <td>
                <h3 style={{ color: color }}>Software</h3>
                Charles Xie
                <br />
                Xiaotong Ding
                <br />
              </td>
              <td>
                <h3 style={{ color: color }}>Content</h3>
                Rundong Jiang
                <br />
                Charles Xie
                <br />
              </td>
              <td>
                <h3 style={{ color: color }}>Research</h3>
                Shannon Sung
                <br />
                Charles Xie
                <br />
              </td>
              <td>
                <h3 style={{ color: color }}>Support</h3>
                Rundong Jiang
                <br />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '10%',
          marginRight: '10%',
          top: top250,
          fontSize: 'small',
          textAlign: 'justify',
          color: color,
        }}
      >
        The National Science Foundation (NSF) of the United States generously provided funding for the research and
        development of this product through grant numbers 2105695 and 2131097. Any opinions, findings, and conclusions
        or recommendations expressed in this product, however, are those of the authors and do not necessarily reflect
        the views of NSF.
      </div>
    </div>
  );
};

export default React.memo(Team);
