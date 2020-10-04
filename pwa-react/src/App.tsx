import * as React from 'react'
import './App.css'

type TimeStamp = number;

export class Section extends React.Component {
  state = {
    start: 4.4,
    end: 32.2
  }
  render() {
    return (<div>
              Section ({this.state.start}-{this.state.end})
            </div>)
  }
}

export default class App extends React.Component {
  render() {
    return (
      <Section />
    )
  }
}
