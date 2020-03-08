import styled from 'styled-components'

import {
  border,
  md,
  lightestColor,
  pinkColor,
  yellowColor,
} from 'global-styles'

export default styled.div`
  position: fixed;
  width: ${props => props.menuWidth - 30}px !important;

  .menu {
    display: block;
    border-right: ${border};
    margin: 0 10px 0 0;
    padding: 0 !important;

    /* this is to keep text from line breaking */
    width: ${props => props.menuWidth + 15}px !important;
    position: absolute;
    right: 0;

    ul {
      padding: 0 !important;

      li.menu-item {
        padding: 20px 40px 20px 0;
        text-align: right;
        display: block;
        position: relative;
        word-wrap: break-word;

        @media (${md}) {
          text-align: center;
          font-size: 1.5rem;
          border-top: ${border};
          padding: 20px 40px;

          &:last-child {
            border-bottom: ${border};
          }
        }

        a {
          color: ${lightestColor} !important;

          &:hover {
            color: ${pinkColor} !important;
          }
        }

        &.active a {
          color: ${yellowColor} !important;
        }
      }
    }

    @media (${md}) {
      position: relative;
      left: -25px;
      margin: 0;
      padding: 0;
      border: none;
    }
  }
`
