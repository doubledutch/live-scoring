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

import React, {PureComponent} from 'react'
import './BigScreen.css'

import {Avatar} from '@doubledutch/react-components'

const numJoinedToShow = 7
export default class BigScreen extends PureComponent {
  state = {scorers: []}
  componentDidMount() {
    const {sessionId} = this.props
    this.backgroundUrlRef().on('value', data => this.setState({backgroundUrl: data.val()}))
    this.sessionRef().on('value', data => this.setState({session: data.val()}))
    this.usersRef().on('child_added', data => {
      const user = data.val()
      if (user.sessionId === sessionId) {
        this.setState(state => ({scorers: [...state.scorers, {...user, id: data.key}]}))
      }
    })
    const removeScorer = data => this.setState(state => ({scorers: state.scorers.filter(u => u.id !== data.key)}))
    this.usersRef().on('child_changed', data => data.val().sessionId !== sessionId && removeScorer(data))
    this.usersRef().on('child_removed', removeScorer)
  }

  render() {
    const {backgroundUrl, session} = this.state
    if (session === undefined) return <div>Loading...</div>
    return (
      <div className="big-screen" style={backgroundUrl ? {backgroundImage: `url(${backgroundUrl})`} : null}>
        {this.renderState(session || {state: 'NOT_STARTED'})}
      </div>
    )
  }

  renderState(session) {
    switch (session.state) {
      case 'NOT_STARTED': return this.renderNotStarted()
      case 'SCORING_OPEN': return this.renderScoring(session, true)
      case 'SCORING_CLOSED': return this.renderScoring(session, false)
      default: return null
    }
  }

  renderNotStarted = () => {
    // Blank screen, or photo credit if using default photo.
    if (!this.state.backgroundUrl) return null
    return <div className="photo-credit">Photo by <a href="https://unsplash.com/photos/Knwea-mLGAg">Felix Mittermeier</a> on <a href="https://unsplash.com/search/photos/night-sky">Unsplash</a></div>
  }

  renderScoring = (session, isOpen) => {
    const score = this.getScoreStats()
    return (
      <div>
        <div className="contestant-name">{session.contestantName}</div>
        <div className="average-score">{score.average == null ? '' : score.average.toFixed(2)}</div>
      </div>
    )
  }

  // renderNotStarted() {
  //   const {scorers} = this.state
  //   if (scorers.length === 0) {
  //     return (
  //       <div className="box joined">
  //         <div className="box-content">
  //           <h1>Waiting</h1>
  //           <h2>for players to join</h2>
  //         </div>
  //       </div>
  //     )
  //   }

  //   return (
  //     <div className="box joined">
  //       <div className="box-content">
  //         <h1>{joined.length}</h1>
  //         <h2>{joined.length > 1 ? 'Have':'Has'} Joined</h2>
  //         <div className="attendees-joined">
  //           { joined.slice(Math.max(0,joined.length-numJoinedToShow)).map((u,i) => (
  //             <div key={u.id}>
  //               <Avatar user={u} size={7} units="vh" />
  //               <span>{u.firstName} {u.lastName}</span>&nbsp;has joined
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  sessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.sessionId)
  backgroundUrlRef = () => this.props.fbc.database.public.adminRef('backgroundUrl')
  usersRef = () => this.props.fbc.database.public.usersRef()

  getScoreStats = () => {
    // This assumes only integer, non-zero scores are possible
    const scores = this.state.scorers.map(s => Math.floor(s.score || 0)).filter(x => x)
    const average = (scores.length === 0)
      ? null
      : scores.reduce((sum, score) => sum + score, 0) / scores.length

    const histogram = scores.reduce((hist, score) => {
      hist[score]++
      return hist
    }, [0,0,0,0,0,0,0,0,0,0])

    return {average, histogram, count: scores.length}
  }
}
