import Image from 'next/image';
import { Col } from 'react-bootstrap';
import YouTube from 'react-youtube';

import { MediaSrc } from '@/types';

type MediaType = { sources: MediaSrc[] };

export default function Media({ sources }: MediaType) {
  return (
    <>
      {sources.map((src, index) => {
        const { key, alt, type } = src;
        let col = 6;

        // full width media on odd and every 3
        if (sources.length % 2 !== 0 && index % 3 === 0) {
          col = 12;
        }

        // define if the media is an image or video
        let mediaType = (
          <Image src={key} alt={alt} width={1000} height={1000} />
        );

        if (type === 'YouTube') {
          mediaType = (
            <div className="youtube">
              <YouTube videoId={key} />
            </div>
          );
        }

        return (
          <Col sm={col} key={key}>
            {mediaType}
          </Col>
        );
      })}
    </>
  );
}
