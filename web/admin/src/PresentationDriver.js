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
import { TextInput } from '@doubledutch/react-components'
import './PresentationDriver.css'

const defaultSeconds = 300

export default class PresentationDriver extends PureComponent {
  publicSessionRef = props =>
    (props || this.props).fbc.database.public
      .adminRef('sessions')
      .child((props || this.props).session.id)

  publicUsersRef = () => this.props.fbc.database.public.usersRef()

  state = {}

  componentWillReceiveProps(newProps) {
    if (this.props.session.id !== newProps.session.id) {
      this.unwireHandlers()
      this.wireHandlers(newProps)
    }
  }

  componentDidMount() {
    this.wireHandlers(this.props)
  }

  componentWillUnmount() {
    this.unwireHandlers()
    this.killTimer()
  }

  wireHandlers(props) {
    this.publicSessionHandler = this.publicSessionRef(props).on('value', data =>
      this.setState({ publicSession: data.val() }),
    )
  }

  unwireHandlers() {
    this.publicSessionRef().off('value', this.publicSessionHandler)
  }

  render() {
    const { session } = this.props
    const { publicSession } = this.state
    if (!session || !publicSession)
      return (
        <div className="presentation-driver">
          <button className="dd-bordered" onClick={this.initializeSession} type="button">
            Initialize
          </button>
        </div>
      )

    switch (publicSession.state) {
      case 'NOT_STARTED':
        return this.renderNotStarted(session)
      case 'INTRO_CONTESTANT':
        return this.renderIntroed(session)
      case 'SCORING_OPEN':
        return this.renderScoringOpen()
      case 'SCORING_CLOSED':
        return this.renderScoringClosed(session, true)
      default:
        return <div className="presentation-driver">{this.renderReset()}</div>
    }
  }

  renderNotStarted(session) {
    const contestantName = session.contestantName || ''
    return (
      <div className="presentation-driver vertical space-children">
        <TextInput
          label="Contestant"
          placeholder="Enter name here"
          value={contestantName}
          onChange={this.updateContestantName}
        />
        <button className="dd-bordered" onClick={this.introContestant} type="button">
          {contestantName ? `Intro ${contestantName}` : 'Intro contestant'}
        </button>
        {this.renderReset()}
      </div>
    )
  }

  renderIntroed(session) {
    const contestantName = session.contestantName || ''
    const seconds = session.seconds || 300
    return (
      <div className="presentation-driver vertical space-children">
        <TextInput
          label="Contestant"
          placeholder="Enter name here"
          value={contestantName}
          onChange={this.updateContestantName}
        />
        <TextInput
          label="Seconds"
          placeholder="300"
          type="number"
          value={seconds}
          onChange={this.updateSeconds}
        />
        <button className="dd-bordered" onClick={this.openScoring} type="button">
          {contestantName ? `Start time for ${contestantName}` : 'Start time'}
        </button>
        {this.renderReset()}
      </div>
    )
  }

  updateContestantName = e => this.props.updateSessionContestantName(e.target.value)

  updateSeconds = e => this.props.updateSessionSeconds(+e.target.value || defaultSeconds)

  renderScoringOpen() {
    return (
      <div className="presentation-driver vertical space-children">
        <button className="dd-bordered" onClick={this.closeScoring} type="button">
          Close scoring
        </button>
        {this.renderReset()}
      </div>
    )
  }

  renderScoringClosed() {
    return <div className="presentation-driver vertical space-children">{this.renderReset()}</div>
  }

  renderScoring(session, showScore) {
    return (
      <div className="presentation-driver vertical space-children">
        {JSON.stringify(session)}
        showScore: {showScore}
        {this.renderReset()}
      </div>
    )
  }

  renderReset = () => (
    <button className="dd-bordered destructive" onClick={this.resetSession} type="button">
      Reset scoring session
    </button>
  )

  resetSession = () => {
    if (
      window.confirm(
        'Are you sure you want to reset scores and prepare for the next contestant? This cannot be undone.',
      )
    ) {
      // Remove the session
      this.killTimer()
      this.publicSessionRef().set({ state: 'NOT_STARTED' })

      // Remove users who were in the removed session.
      this.publicUsersRef().once('value', data => {
        const users = data.val() || {}
        Object.keys(users)
          .filter(id => users[id].sessionId === this.props.session.id)
          .forEach(id =>
            this.publicUsersRef()
              .child(id)
              .remove(),
          )
      })
    }
  }

  initializeSession = () => {
    this.publicSessionRef().set({ state: 'NOT_STARTED' })
  }

  openScoring = () => {
    const { session } = this.props
    const seconds = session.seconds || defaultSeconds
    this.publicSessionRef().set({
      state: 'SCORING_OPEN',
      contestantName: session.contestantName,
      seconds,
    })

    this.timer = setTimeout(this.closeScoring, seconds * 1000)
  }

  killTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  introContestant = () =>
    this.publicSessionRef().set({
      state: 'INTRO_CONTESTANT',
      contestantName: this.props.session.contestantName,
    })

  closeScoring = () => {
    this.killTimer()
    this.publicSessionRef().update({ state: 'SCORING_CLOSED' })
  }
}
