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
import {TextInput} from '@doubledutch/react-components'
import './PresentationDriver.css'

export default class PresentationDriver extends PureComponent {
  publicSessionRef = props => (props || this.props).fbc.database.public.adminRef('sessions').child((props || this.props).session.id)
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
  }

  wireHandlers(props) {
    this.publicSessionHandler = this.publicSessionRef(props).on('value', data => this.setState({publicSession: data.val()}))
  }

  unwireHandlers() {
    this.publicSessionRef().off('value', this.publicSessionHandler)
    this.clearTimer()
  }

  render() {
    const {session} = this.props
    const {publicSession} = this.state
    if (!session || !publicSession) return <div className="presentation-driver"><button className="dd-bordered" onClick={this.initializeSession}>Initialize</button></div>

    switch (publicSession.state) {
      case 'NOT_STARTED': return this.renderNotStarted(session)
      case 'SCORING_OPEN': return this.renderScoringOpen()
      case 'SCORING_CLOSED': return this.renderScoringClosed(session, true)
      default: return <div className="presentation-driver">{this.renderReset()}</div>
    }
  }

  renderNotStarted(session) {
    const contestantName = session.contestantName || ''
    return (
      <div className="presentation-driver vertical space-children">
        <TextInput label="Contestant" placeholder="Enter name here" value={contestantName} onChange={this.updateContestantName} />
        <button className="dd-bordered" onClick={this.openScoring}>{ contestantName ? `Open scoring for ${contestantName}` : 'Open scoring' }</button>
        { this.renderReset() }
      </div>
    )
  }

  updateContestantName = e => this.props.updateSessionContestantName(e.target.value)

  renderScoringOpen() {
    return <div className="presentation-driver vertical space-children">
      <button className="dd-bordered" onClick={this.closeScoring}>Close scoring</button>
      { this.renderReset() }
    </div>
  }

  renderScoringClosed() {
    return <div className="presentation-driver vertical space-children">
      { this.renderReset() }
    </div>
  }

  renderScoring(session, showScore) {
    return <div className="presentation-driver vertical space-children">
      { JSON.stringify(session) }
      showScore: {showScore}
      { this.renderReset() }
    </div>
  }

  renderReset = () => <button className="dd-bordered destructive" onClick={this.resetSession}>Reset scoring session</button>

  resetSession = () => {
    if (window.confirm('Are you sure you want to reset scores and prepare for the next contestant? This cannot be undone.')) {
      // Remove the session
      this.publicSessionRef().set({state: 'NOT_STARTED'})

      // Remove users who were in the removed session.
      this.publicUsersRef().once('value', data => {
        const users = data.val() || {}
        Object.keys(users)
          .filter(id => users[id].sessionId === this.props.session.id)
          .forEach(id => this.publicUsersRef().child(id).remove())
      })
    }
  }

  initializeSession = () => {
    this.publicSessionRef().set({state: 'NOT_STARTED'})

  }
  openScoring = () => this.publicSessionRef().set({state: 'SCORING_OPEN', contestantName: this.props.session.contestantName})
  closeScoring = () => this.publicSessionRef().update({state: 'SCORING_CLOSED'})
}
