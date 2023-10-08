import { Metadata } from 'next';

import Form from './Form';

export const metadata: Metadata = {
  title: 'Contact - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function Contact() {
  return (
    <div className="relative flex h-full w-full justify-end">
      <section>
        <article>
          <Form />
        </article>
      </section>
    </div>
  );
}
