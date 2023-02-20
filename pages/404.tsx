import { useRef, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { FaPause, FaPlay } from 'react-icons/fa';

import useWindowSize from '@/hooks/useWindowSize';
import library from '@/styles/_library.module.scss';

export default function Custom404() {
  const { height } = useWindowSize();
  const videoRef = useRef<any>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleTogglePlayVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) videoRef.current.pause();
      else videoRef.current.play();

      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <>
      <Container
        onClick={handleTogglePlayVideo}
        style={{
          cursor: 'pointer',
          zIndex: '0',
          overflow: 'hidden',
          height,
        }}
      >
        <Row
          style={{
            width: '100%',
            maxWidth: '600px',
            margin: '10px 0',
          }}
        >
          <Col>
            <Row
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                background: library.darkColor,
              }}
            >
              <Col>
                <h3>404 - Page not found</h3>
              </Col>
              <Col style={{ flex: '0 1' }}>
                <a>
                  {isVideoPlaying ? (
                    <FaPause size={24} />
                  ) : (
                    <FaPlay size={24} />
                  )}
                </a>
              </Col>
            </Row>
          </Col>
        </Row>
        <video
          ref={videoRef}
          loop
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'cover',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            zIndex: '-1',
          }}
        >
          <source src="/404/hello-is-it-me.mp4" type="video/mp4" />
        </video>
      </Container>
      <div
        style={{
          position: 'fixed',
          height,
          width: '100%',
          top: '50%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
          cursor: 'pointer',
          zIndex: '-2',
          background: library.darkestColor,
        }}
      />
    </>
  );
}
