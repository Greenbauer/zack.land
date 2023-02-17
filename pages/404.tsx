import { useRef, useState } from "react";
import { Col, Row, Container } from 'react-bootstrap'
import { FaPlay, FaPause } from 'react-icons/fa';

export default function Custom404() {
    const videoRef = useRef(null)
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)

    const handleTogglePlayVideo = () => {
        if (videoRef.current) {
            // @ts-ignore
            if (isVideoPlaying) videoRef.current.pause();
            // @ts-ignore
            else videoRef.current.play();

            setIsVideoPlaying(!isVideoPlaying)
        }
    }

    return (
        <Container
            onClick={handleTogglePlayVideo}
            style={{ cursor: 'pointer' }}
        >
            <Row
                style={{
                    position: 'absolute',
                    width: 'calc(100% - 40px)',
                    maxWidth: '500px',
                    top: '20px',
                    left: '30px',
                    zIndex: '99'
                }}>
                <Col>
                    <div className="section">
                        <div className="article">
                            <Row style={{
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Col>
                                    <h5>
                                        404 - Page not found
                                    </h5>
                                </Col>
                                <Col style={{ flex: '0 1' }}>
                                    <a>
                                        {isVideoPlaying
                                            ? <FaPause size={24} />
                                            : <FaPlay size={24} />
                                        }
                                    </a>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Col>
            </Row>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
            }}>
                <video
                    ref={videoRef}
                    loop
                    style={{
                        height: '100vh',
                        width: 'auto'
                    }}>
                    <source src="/404/hello-is-it-me.mp4" type="video/mp4" />
                </video>
            </div>
        </Container>
    )
}