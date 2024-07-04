import React, { useState } from 'react';
import '../GiveFeedback.css';
import dissatisfied from "../rage.png";
import sad from "../white_frowning_face.png";
import expressionless from "../expressionless.png";
import happy from "../smile.png";
import satisfied from "../heart_eyes.png";

export default function GiveFeedback() {
  const emojiArray = [
    { id: 1, image: dissatisfied },
    { id: 2, image: sad },
    { id: 3, image: expressionless },
    { id: 4, image: happy },
    { id: 5, image: satisfied },
  ];

  const [selectedEmojiId, setSelectedEmojiId] = useState(null);

  function handleClick(id) {
    setSelectedEmojiId(id);
    console.log(selectedEmojiId);
  }

  return (
    <div className="give--feedback--div">
      <p className='give--feedback--head'>Rate Us</p>
      <div className='give--feedback--description--div'>
        <p className='give--feedback--description'>
          Your input is super important
          in helping us understand
          your needs better, so we can
          customize our services to
          suit you perfectly.
        </p>
      </div>
      <p className='how--rate'>How would you rate our app?</p>
      <div className='all-emojis'>
        {emojiArray.map((item) => (
            <img
              key={item.id}
              id={item.id}
              src={item.image}
              onClick={() => handleClick(item.id)}
              className={selectedEmojiId === item.id ? 'selected-emoji' : 'emoji'}
              alt='emoji'
            />
        ))}
      </div>
      <div className='input--div'>
        <textarea className='comment' placeholder='Add a Comment'></textarea>
      </div>
      <button type='button' className='submit--feedback'>Submit Feedback</button>
    </div>
  );
}
