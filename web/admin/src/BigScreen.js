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

import React, { PureComponent } from 'react'
import './BigScreen.css'

import { mapPushedDataToStateObjects } from '@doubledutch/firebase-connector'
import HeartFloats from './HeartFloats'
import Timer from './Timer'

const defaultEmoji = '❤️'

export default class BigScreen extends PureComponent {
  state = { scorers: {}, emoji: defaultEmoji }

  componentDidMount() {
    this.backgroundUrlRef().on('value', data => this.setState({ backgroundUrl: data.val() }))
    this.emojiRef().on('value', data => this.setState({ emoji: data.val() || defaultEmoji }))
    this.sessionRef().on('value', data => this.setState({ session: data.val() }))

    // {state: {scorers: {'id': {...user, score}}}}
    mapPushedDataToStateObjects(this.usersRef(), this, 'scorers')
  }

  render() {
    const { backgroundUrl, session } = this.state
    if (session === undefined) return <div>Loading...</div>
    return (
      <div
        className="big-screen"
        style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : null}
      >
        {this.renderState(session || { state: 'NOT_STARTED' })}
      </div>
    )
  }

  renderState(session) {
    switch (session.state) {
      case 'NOT_STARTED':
        return this.renderNotStarted()
      case 'INTRO_CONTESTANT':
        return this.renderIntro(session)
      case 'SCORING_OPEN':
        return this.renderScoring(session)
      case 'SCORING_CLOSED':
        return this.renderScore(session)
      default:
        return null
    }
  }

  renderNotStarted = () => {
    // Blank screen, or photo credit if using default photo.
    if (this.state.backgroundUrl) return null
    return (
      <div className="photo-credit">
        Photo by <a href="https://unsplash.com/photos/Knwea-mLGAg">Felix Mittermeier</a> on{' '}
        <a href="https://unsplash.com/search/photos/night-sky">Unsplash</a>
      </div>
    )
  }

  renderScoring = session => {
    const score = this.getScoreStats()
    return (
      <div>
        <div className="contestant-name">{session.contestantName}</div>
        <Timer totalSeconds={session.seconds} className="average-score" />
        <HeartFloats heartCount={score.average * score.count} emoji={this.state.emoji} />
      </div>
    )
  }

  renderScore = session => {
    const { emoji } = this.state
    const score = this.getScoreStats()
    const totalHearts = (score.average || 0) * (score.count || 0)
    return (
      <div>
        <div className="contestant-name">{session.contestantName}</div>
        <div className="average-score">
          {totalHearts}{' '}
          <span role="img" aria-label="heart">
            {emoji}
          </span>
        </div>
      </div>
    )
  }

  renderIntro = session => (
    <div>
      <div className="contestant-name">{session.contestantName}</div>
    </div>
  )

  sessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.sessionId)

  backgroundUrlRef = () => this.props.fbc.database.public.adminRef('backgroundUrl')

  emojiRef = () => this.props.fbc.database.public.adminRef('emoji')

  usersRef = () => this.props.fbc.database.public.usersRef()

  getScoreStats = () => {
    // This assumes only integer, non-zero scores are possible
    const scores = Object.values(this.state.scorers)
      .map(s => Math.floor(s.score || 0))
      .filter(x => x)
    const average =
      scores.length === 0 ? null : scores.reduce((sum, score) => sum + score, 0) / scores.length

    const histogram = scores.reduce(
      (hist, score) => {
        hist[score]++
        return hist
      },
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    )

    return { average, histogram, count: scores.length }
  }
}
