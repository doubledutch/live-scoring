/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import './HeartFloats.css'

const randomishX = i => `${((i * 10) ** 71 % 78) + 10}vw`

const HeartFloats = ({ heartCount, emoji }) => {
  const hearts = []

  for (let i = 0; i < heartCount; ++i) {
    hearts.push(
      <CSSTransition classNames="heart" in unmountOnExit timeout={5000} key={`heart-${i}`}>
        <span role="img" aria-label="heart" className="heart" style={{ left: randomishX(i) }}>
          {emoji}
        </span>
      </CSSTransition>,
    )
  }

  return <TransitionGroup>{hearts}</TransitionGroup>
}

export default HeartFloats
