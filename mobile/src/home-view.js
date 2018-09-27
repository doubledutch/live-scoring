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
import {Slider, StyleSheet, Text, View} from 'react-native'
import debounce from 'lodash.debounce'

// rn-client must be imported before FirebaseConnector
import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import {provideFirebaseConnectorToReactComponent} from '@doubledutch/firebase-connector'

const sessionId = 'default'

class HomeView extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {}
    client.getCurrentUser().then(currentUser => {
      this.setState({currentUser})
      client.getAttendee(currentUser.id).then(currentUser => this.setState({currentUser}))
    })

    this.signin = this.props.fbc.signin()
      .then(user => this.user = user)

    this.signin.catch(err => console.error(err))
  }

  userRef = () => this.props.fbc.database.public.userRef()
  publicSessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(sessionId)

  componentDidMount() {
    this.signin.then(() => {
      this.userRef().on('value', data => this.setState({user: data.val() || {}}))
      this.publicSessionRef().on('value', data => this.setState({session: data.val()}))
    })
  }

  render() {
    return (
      <View style={s.container}>
        <TitleBar title="Live Scoring" client={client} signin={this.signin} />
        {this.renderSession()}
      </View>
    )
  }

  renderSession() {
    const {currentUser, user, session} = this.state
    if (!currentUser || !user) return <View style={s.center}><Text style={s.title}>Loading...</Text></View>
    switch ((session || {}).state) {
      case 'SCORING_OPEN': return (
        <View style={s.container}>
          <View style={s.center}>
            <Text style={s.title}>Select a score for {session.contestantName}.</Text>
            <Text style={s.score}>{user.score || ' '}</Text>
            <Slider style={s.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={user.score || 0}
              onValueChange={this.onSlide}
            />
          </View>
          {/* <Avatar user={currentUser} client={client} size={100} /> */}
        </View>
      )
      case 'SCORING_CLOSED': return (
        <View style={s.center}><Text style={s.title}>Scoring is closed for {session.contestantName}.</Text></View>
      )
      default: return (
        <View style={s.center}><Text style={s.title}>Please wait for live scoring to be enabled.</Text></View>
      )
    }
  }

  onSlide = score => {
    const {user} = this.state
    if (score) {
      this.setState({user: {...user, score}})
      this.pushScore(score)
    }
  }

  pushScore = debounce(score => {
    const {currentUser} = this.state
    if (currentUser) {
      let {firstName, lastName} = currentUser
      firstName = firstName || ''
      lastName = lastName || ''
      this.userRef().set({firstName, lastName, sessionId, score})
    }
  }, 250)
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d9e1f9',
    alignItems: 'center',
    paddingBottom: 20,
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    paddingVertical: 20,
    textAlign: 'center'
  },
  slider: {
    marginHorizontal: 50,
  },
  score: {
    fontSize: 40,
    paddingVertical: 20,
    textAlign: 'center',
  },
})

export default provideFirebaseConnectorToReactComponent(client, 'livescoring', (props, fbc) => <HomeView {...props} fbc={fbc} />, PureComponent)
