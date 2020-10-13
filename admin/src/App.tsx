import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'

import './App.css';
import logo from './neoflix-logo.png'

import { Container, Menu } from 'semantic-ui-react';

import Home from './views/Home'
import Movie from './views/Movie'
import Genres from './views/Genres'
import Packages from './views/Packages'


function App() {
  return (
    <div className="App">
      <Router>
        <Menu inverted pointing fixed="top" style={{ padding: '1em 0'}}>
          <Container>
          <Menu.Item as={Link} to="/" style={{padding: '0 1em 0 0'}}><img src={logo} alt="Neoflix" style={{width: '6em'}} /></Menu.Item>
          <Menu.Item as={Link} to="/"><strong>Admin Graph App</strong></Menu.Item>
          <Menu.Item as={Link} to="/genres">Genres</Menu.Item>
          <Menu.Item as={Link} to="/packages">Packages</Menu.Item>
          </Container>
        </Menu>
        <main className="ui main container">
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/movie/:id" component={Movie} />
            <Route exact path="/genres" component={Genres} />
            <Route exact path="/packages" component={Packages} />
          </Switch>
        </main>
      </Router>
    </div>
  );
}

export default App;
