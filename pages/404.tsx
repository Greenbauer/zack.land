import { useRef, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { FaPause, FaPlay } from 'react-icons/fa';

import library from '@/styles/_library.module.scss';

export default function Custom404() {
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
    <Container onClick={handleTogglePlayVideo} style={{ cursor: 'pointer' }}>
      <div
        style={{
          position: 'fixed',
          top: '0',
          bottom: '0',
          left: '0',
          right: '0',
          background: library.darkestColor,
          zIndex: '-1',
        }}
      />
      <Row
        style={{
          position: 'absolute',
          width: 'calc(100% - 40px)',
          top: '10px',
          left: '30px',
          zIndex: '99',
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
                {isVideoPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
              </a>
            </Col>
          </Row>
        </Col>
      </Row>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          zIndex: '0',
        }}
      >
        <video
          ref={videoRef}
          loop
          style={{
            height: '100vh',
            width: 'auto',
          }}
        >
          <source src="/404/hello-is-it-me.mp4" type="video/mp4" />
        </video>
      </div>
    </Container>
  );
}
