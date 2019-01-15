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
import './Admin.css'

import { mapPushedDataToStateObjects } from '@doubledutch/firebase-connector'
import PresentationDriver from './PresentationDriver'
import { openTab } from './utils'

const sessionId = 'default'

export default class Admin extends PureComponent {
  state = {
    sessions: {},
    users: {},
    publicSessions: {},
    backgroundUrl: '',
  }

  sessionsRef = () => this.props.fbc.database.private.adminRef('sessions')

  backgroundUrlRef = () => this.props.fbc.database.public.adminRef('backgroundUrl')

  publicUsersRef = () => this.props.fbc.database.public.usersRef()

  publicSessionRef = () => this.props.fbc.database.public.adminRef('sessions')

  componentDidMount() {
    const { fbc } = this.props
    mapPushedDataToStateObjects(this.sessionsRef(), this, 'sessions')
    mapPushedDataToStateObjects(this.publicUsersRef(), this, 'users')
    mapPushedDataToStateObjects(this.publicSessionRef(), this, 'publicSessions')
    this.backgroundUrlRef().on('value', data => this.setState({ backgroundUrl: data.val() || '' }))
    fbc.getLongLivedAdminToken().then(longLivedToken => this.setState({ longLivedToken }))
  }

  render() {
    const { backgroundUrl, launchDisabled, sessions, users } = this.state

    const session = sessions[sessionId] || { id: sessionId }

    return (
      <div className="Admin vertical space-children">
        <p className="boxTitle">Live Scoring</p>
        {sessionId && (
          <div>
            <div className="presentation-container">
              <div className="presentation-side">
                <iframe
                  className="big-screen-container"
                  src={this.bigScreenUrl()}
                  title="presentation"
                />
                <div className="presentation-overlays">
                  <div>
                    Presentation Screen&nbsp;
                    <button
                      className="dd-bordered overlay-button"
                      onClick={this.launchPresentation}
                      disabled={launchDisabled || !this.bigScreenUrl()}
                    >
                      Launch Presentation
                    </button>
                  </div>
                </div>
              </div>
              <div className="presentation-side">
                <PresentationDriver
                  fbc={this.props.fbc}
                  session={session}
                  users={users}
                  updateSessionContestantName={this.updateSessionContestantName}
                  updateSessionSeconds={this.updateSessionSeconds}
                />
                <div className="presentation-overlays">
                  <div>Controls</div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div>
          <input
            type="text"
            value={backgroundUrl}
            onChange={this.onBackgroundUrlChange}
            placeholder="Custom background image URL. Suggested at least 700px high and wide."
            className="dd-bordered background-url"
          />
        </div>
      </div>
    )
  }

  updateSessionContestantName = contestantName => {
    this.sessionsRef()
      .child(sessionId)
      .update({ contestantName })
    if (this.state.publicSessions[sessionId])
      this.publicSessionRef()
        .child(sessionId)
        .update({ contestantName })
  }

  updateSessionSeconds = seconds => {
    this.sessionsRef()
      .child(sessionId)
      .update({ seconds })
  }

  onBackgroundUrlChange = e => this.backgroundUrlRef().set(e.target.value)

  createSession = () =>
    this.sessionsRef()
      .child('default')
      .set({ name: 'default' })

  deleteSession = () => {
    const { sessions } = this.state
    if (window.confirm(`Are you sure you want to delete session '${sessions[sessionId].name}'?`)) {
      this.setState({ sessionId: '' })
      this.sessionsRef()
        .child(sessionId)
        .remove()
      this.publicSessionRef()
        .child(sessionId)
        .remove()
    }
  }

  launchPresentation = () => {
    this.setState({ launchDisabled: true })
    setTimeout(() => this.setState({ launchDisabled: false }), 2000)
    openTab(this.bigScreenUrl())
  }

  bigScreenUrl = () =>
    this.state.longLivedToken
      ? `?page=bigScreen&sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(
          this.state.longLivedToken,
        )}`
      : null
}
