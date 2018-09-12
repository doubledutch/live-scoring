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

import React, { Component } from 'react'
import {Slider, StyleSheet, Text, View} from 'react-native'
import debounce from 'lodash.debounce'

// rn-client must be imported before FirebaseConnector
import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
const fbc = FirebaseConnector(client, 'livescoring')

fbc.initializeAppWithSimpleBackend()

const sessionId = 'default'

export default class HomeView extends Component {
  constructor() {
    super()

    this.state = {}
    client.getCurrentUser().then(currentUser => this.setState({currentUser}))

    this.signin = fbc.signin()
      .then(user => this.user = user)

    this.signin.catch(err => console.error(err))
  }

  userRef = () => fbc.database.public.userRef()

  componentDidMount() {
    this.signin.then(() => {
      this.userRef().on('value', data => this.setState({user: data.val() || {}}))
    })
  }

  render() {
    const {currentUser, user} = this.state

    return (
      <View style={s.container}>
        <TitleBar title="Live Scoring" client={client} signin={this.signin} />
        {currentUser && user
          ? <View style={s.container}>
              <View style={s.center}>
                <Text style={s.title}>Score the contestant</Text>
                <Slider style={s.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={user.score || 0}
                  onValueChange={this.onSlide}
                />
                <Text style={s.score}>{user.score || ' '}</Text>
              </View>
              <Avatar user={currentUser} client={client} size={100} />
            </View>
          : null
        }
      </View>
    )
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
      const {firstName, lastName, image} = currentUser
      this.userRef().set({firstName, lastName, image, sessionId, score})
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
    marginHorizontal: 10,
  },
  score: {
    fontSize: 40,
    paddingVertical: 20,
    textAlign: 'center',
  },
})
