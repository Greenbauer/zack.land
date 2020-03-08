import { createGlobalStyle } from 'styled-components'

export const lightestColor = '#dddddd'
export const lightColor = '#999999'
export const mediumLightColor = '#777777'
export const mediumDarkColor = '#333333'
export const darkColor = '#171717'
export const darkestColor = '#111111'
export const darkBlueColor = 'rgba(0, 51, 128, 0.75)'
export const cyanColor = 'rgba(61, 225, 255, 0.75)'
export const pinkColor = 'rgba(255, 49, 175, 0.75)'
export const yellowColor = 'rgba(255, 210, 101, 0.75)'

export const border = '1px solid #222222'
export const shadow = '0 0 20px rgba(0, 0, 0, .8)'

export const sm = 'max-width: 576px'
export const md = 'max-width: 768px'
export const lg = 'max-width: 992px'
export const xl = 'max-width: 1200px'

/* eslint no-unused-expressions: 0 */
export default createGlobalStyle`
  html, body {
    min-height: 100%;
    min-width: 100%;
    background-color: ${darkestColor};
    z-index: -1;
    display: flex;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .app-body {
    display: flex;
    flex-grow: 1;
    width: 100%;
    padding-top: 140px;
    position: relative;
  }

  body.fontLoaded {
    font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  #app {
    background-color: transparent;
    min-height: 100%;
    min-height: 100vh;
    min-width: 100%;
    position: relative;
    display: flex;
    overflow-x: hidden;
  }

  h1 {
    font-size: 4.5em;
    margin-bottom: 0.4em;
    text-transform: Uppercase;
    letter-spacing: 0.05em;

    background: ${darkestColor} linear-gradient(
      80deg,
      ${yellowColor} 4%,
      ${pinkColor} 8%,
      ${cyanColor} 20%,
      ${darkBlueColor} 85%
    );
    background-size: auto auto;
    background-size: 100% 100%;
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (${xl}) {
      font-size: 3.2rem;
    }

    @media (${lg}) {
      font-size: 2.5rem;
    }

    @media (${md}) {
      font-size: 9vw;
    }

    @media (${sm}) {
      font-size: 30px;
    }
  }

  h2 {
    font-family: 'Roboto', sans-serif;
    font-weight: 100 !important;
    font-size: 2.5em;
    margin-bottom: 20px;
    text-transform: Uppercase;
    letter-spacing: 0.03em;
    color: ${lightestColor};

    @media (${lg}) {
      font-size: 2.2rem;
    }

    @media (${md}) {
      font-size: 1.5rem;
    }

    @media (${sm}) {
      font-size: 18px;
    }
  }

  h3 {
    font-size: 26px !important;
    text-transform: Uppercase;
    letter-spacing: 0.03em;
    color: ${lightestColor};
    padding: 0;
    margin: 0;

    @media (${xl}) {
      font-size: 2vw !important;
    }

    @media (${md}) {
      font-size: 26px !important;
    }
  }

  h4 {
    font-size: 20px;
    letter-spacing: 0.03em;
    color: ${lightestColor};
    padding: 0;
    margin: 0;
  }

  h6 {
    font-family: 'Roboto', sans-serif;
    font-weight: 100 !important;
    font-size: 1.8rem !important;
    letter-spacing: 0.03rem !important;
    line-height: 3rem !important;
    margin-bottom: 0 !important;
    color: ${lightestColor};
  
    @media (${md}) {
      font-size: 1.5rem !important;
    }
  
    @media (${sm}) {
      font-size: 20px !important;
      line-height: 2rem !important;
    }
  }

  p, label {
    font-size: 18px;
    line-height: 1.5em;
    color: ${lightColor};
  }

  small, .text-muted {
    color: ${mediumLightColor} !important;
    font-family: 'Roboto', sans-serif;
    font-weight: 400;
    letter-spacing: 0.07em;
    font-size: 16px;
  }

   a, a span {
    text-decoration: none !important;
    color: ${cyanColor} !important;

    &:hover {
      color: ${pinkColor} !important;
    }
    &:active {
      color: ${mediumDarkColor} !important;
    }
    &:focus {
      color: ${cyanColor};
    }
  }

  img {
    height: auto;
    width: 100%;
  }

  .header-title {
    color: ${lightColor};
    text-transform: uppercase;
    font-size: 1.5rem;
    letter-spacing: 0.03em;
    padding: 0;
    position: relative;
    margin-left: auto;
    margin-right: 0;
    text-align: right;
    float: right;
    width: 100%;
    display: inline-block;

    @media (${lg}) {
      font-size: 2vw;
      line-height: 3rem;
    }
    @media (${md}) {
      font-size: 4vw;
      width: 80%;
    }
    @media (${sm}) {
      font-size: 22px;
    }
  }

  footer {
    padding-bottom: 40px;
    width: 100%;
    top: 100%;

    .footer-icons > * {
      position: absolute;
      display: inline-block;
      bottom: 6px;

      a {
        padding: 0 20px;

        path {
          fill: ${lightColor};
        }

        &:hover path {
          fill: ${yellowColor};
        }
        &:active path {
          fill: ${mediumDarkColor};
        }
      }

      @media (${md}) {
        position: relative;
      }
    }

    .footer-text {
      a {
        padding: 0 0 0.3% 0;
        border-bottom: 1px solid ${pinkColor}; /* pink */
      
        &:hover {
          border-color: ${yellowColor}; /* yellow */
        }
        &:active {
          border-color: ${mediumDarkColor};
        }
        &:focus {
          border-color: ${pinkColor}; /* pink */
        }
      }
    }

    @media (${md}) {
      .text-left, .text-right {
        text-align: center !important;
      }

      .footer-icons {
        order: 1;
      }

      .footer-text {
        order: 0;
        padding-bottom: 40px;
      }
    }
  }

  .cover {
    height: 100%;
    align-content: center;
    align-items: center;
    margin-top: -40px;

    @media (${md}) {
      text-align: center;
    }
  }

  .section {
    position: relative;
    box-shadow: ${shadow};
    background-color: ${darkColor};
    margin-bottom: 40px;

    &.form-section {
      width: 460px;
      display: table;
      float: right;

      @media (${md}) {
        width: 100%;
      }
    }

    .scroll-item {
      position: absolute;
      top: -140px;
    }
  }

  .article {
    padding: 40px 40px 35px 40px;
    width: 100%;

    li {
      padding: 15px 0 5px 0;
    }
  }

  .youtube {
    position: relative;
    padding-bottom: 56.25%; /* is 16:9 */
    height: 0;

    iframe {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
    }
  }

  .alert {
    text-align: center;
    color: ${cyanColor} !important;
  }

  .container {
    min-height: 100%;
    width: 1440px;
    position: relative;
  
    @media (${xl}) {
      width: 900px;
  
      .col-lg-6 {
        flex: 0 0 50%;
        max-width: 50%;
      }
    }
    @media ${lg}) {
      width: 760px;
    }
    @media (${md}) {
      width: 100%;
      .col-xl-4, .col-lg-6  {
        flex: 0 0 100%;
        max-width: 100%;
      }
    }
  }

  .navbar {
    padding: 0;
    background: transparent;
    box-shadow: none;

    &.scrolling {
      background: ${darkColor} !important;
      box-shadow: ${shadow} !important;

      .nav-collapse {
        border-bottom: none !important;

        .nav-item {
          background-color: ${darkColor} !important;
        }
      }
    }

    .h2 {
      width: 3vw;
    }
  
    .container {
      padding-left: 15px !important;
      padding-right: 15px !important;

      .nav-collapse {
        width: auto !important;
        border-bottom: ${border};

        > * {
          width: auto;
          margin: 1rem;
          position: relative;

          .navbar-nav {
            position: relative;

            .nav-item {
              word-break: keep-all;
              text-transform: uppercase;
              color: ${lightColor} !important;
              background-color: ${darkestColor};
              padding: 0 !important;
              cursor: pointer;
              transition: background 0.2s, color 0.3s;
              transition-delay: 0s, 0.2s;
              display: block;
              position: relative;

              .nav-link {
                padding: 7px 25px !important;
                color: ${lightColor} !important;
                
                &.active, &:active {
                  color: ${lightestColor} !important;
                }
              }
        
              &:hover, &:focus {
                background-color: transparent !important;
                border: none;

                .nav-link {
                  color: ${lightestColor} !important;
                }
              }
            }
          }
        }

        @media (${md}) {
          display: none;

          &.active {
            display: flex;
          }
        }
      }
    }

    @media (${md}) {
      &.scrolling {
        background: ${darkestColor} !important;
  
        .nav-collapse {
          border-bottom: none !important;
  
          .nav-item {
            background-color: ${darkestColor} !important;
          }
        }
      }

      .container {
        .nav-collapse {
          width: 100vw !important;
          height: 100vh !important;
          margin-left: auto;
          margin-top: 45px;
          padding-top: 60px;
          top: 0;
          left: 0;
          z-index: 99;
          position: fixed;
          background-color: ${darkestColor};
          border: none !important;

          > * {
            width: 100%;
            height: 100%;
            right: auto;
            margin: 0;
            padding: 0;

            .navbar-nav {
              flex-direction: column !important;

              .nav-item {
                text-align: center;
                font-size: 1.5rem;
                border-bottom: ${border};
                padding: 20px 40px;
        
                &:first-child {
                  border-top: ${border};
                }
        
                &.active, &:active,
                &:hover, &:focus {
                  background-color: transparent;
                  color: ${lightestColor} !important;
                }
              }
            }
          }
        }
      }
    }
  }

 

  form {
    margin-bottom: 1em;

    input {
      outline: none !important;
      border-radius: 0 !important;
      background-color: ${darkestColor} !important;
      color: ${mediumLightColor} !important;
      border: #1b1b1b !important;
  
      &:hover, &:focus {
        background-color: ${darkestColor} !important;
        border: #1b1b1b !important;
        color: ${mediumLightColor} !important;
        box-shadow: none !important;
      }
  
      &::placeholder {
        color: ${mediumDarkColor} !important;
      }
    }
  
    textarea {
      outline: none !important;
      border-radius: 0 !important;
      background-color: ${darkestColor} !important;
      height: 180px;
      color: ${mediumLightColor} !important;
      border: #1b1b1b !important;
    
      &:hover, &:focus {
        background-color: ${darkestColor} !important;
        color: ${mediumLightColor} !important;
        border: #1b1b1b !important;
        box-shadow: none !important;
      }
    
      &::placeholder {
        color: ${mediumDarkColor} !important;
      }
    }

    small {
      width: 100%;
      min-height: 30px;
      float: right;
      text-align: right;
      color: ${yellowColor} !important;
    }

    button {
      margin: 20px 0;
    }
  }

  .form-control {
    font-size: 18px;
  }

  .card-columns {
    column-count: 3;
    padding: 0 15px 40px 15px;
    width: 100%;

    .card {
      box-shadow: ${shadow};
      border: none !important;
      border-radius: 0 !important;
      background-color: ${darkColor} !important;
      margin-bottom: 15px !important;

       > div {
         padding: 0px;
       }

      img {
        background-color: #ffffff;
      }
  
      .card-body {
        padding: 40px 40px 35px 40px;
      }
  
      @media (${md}) {
        margin: 0;
      }
    }

    @media (${xl}) {
      column-count: 2 !important;
    }
    
    @media (${md}) {
      column-count: 1 !important;
      margin: 0;
    }
  }
`
