'use client';

import { useState } from 'react';

export default function ProfilePhoto({ src, name }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="profile-photo">
      {src && !failed ? (
        <img src={src} alt="" width="42" height="42" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}
