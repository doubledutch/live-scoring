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

const twoDigits = i => `${i < 10 ? '0' : ''}${Math.floor(i)}`
const minSec = s => `${Math.floor(s / 60)}:${twoDigits(s % 60)}`

export default class Timer extends PureComponent {
  state = {}

  componentDidMount() {
    this.init()
  }

  componentDidUpdate() {
    this.init()
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  init() {
    const { totalSeconds } = this.props
    if (this.totalSeconds !== totalSeconds) {
      this.totalSeconds = this.props.totalSeconds
      this.startTime = new Date().valueOf()
      if (this.timer) clearInterval(this.timer)
      this.setState({ seconds: totalSeconds - 1 })
      this.timer = setInterval(
        () =>
          this.setState({
            seconds: Math.floor(totalSeconds - (new Date().valueOf() - this.startTime) / 1000),
          }),
        250,
      )
    }
  }

  render() {
    const { className } = this.props
    const { seconds } = this.state

    return <div className={className}>{minSec(seconds)}</div>
  }
}
