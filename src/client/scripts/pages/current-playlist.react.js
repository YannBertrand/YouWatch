let isPlaylistPlaying = false;

const Player = React.createClass({
  onStateChange: function (event) {
    if (event.data === YT.PlayerState.UNSTARTED) return;
    if (event.data === YT.PlayerState.CUED) return;

    if (event.data === YT.PlayerState.ENDED) {
      // No more video to play
      // (1 because we will remove the played video)
      if (this.state.playlist.length === 1)
        isPlaylistPlaying = false;

      // Remove last played video
      window.dispatchEvent(new CustomEvent('playlist.removeVideo', { detail: { video: this.state.playlist[0] } }));

      // The video has changed
      // Seize the opportunity to update the playlist without interruption
      this.updatePlaylist();
    } else {
      isPlaylistPlaying = true;
    }
  },
  updatePlaylist: function () {
    if (!this.state.playlist.length) return;
    if (!this.state.player.getPlaylist()) return;

    // Update playlist and start playing
    this.state.player.loadPlaylist(this.state.playlist);
  },
  componentWillReceiveProps(nextProps) {
    if (!isPlaylistPlaying && this.state.player.cuePlaylist && nextProps.playlist.length) {
      this.state.player.cuePlaylist(nextProps.playlist);
    }

    this.setState({
      playlist: nextProps.playlist,
    });
  },
  componentDidMount: function () {
    this.setState({
      playlist: [],

      // YT may not be loaded at this time, need to find a solution...
      // That's probably why I can't put this in a getInitialState method
      player: new YT.Player('player', {
        events: {
          onStateChange: this.onStateChange
        }
      })
    });
  },
  render: function () {
    return <div id="player"></div>;
  }
});

const PlaylistItem = React.createClass({
  raise: function () {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.raiseVideo', { detail: { video: this.props } }));
    }
  },
  remove: function () {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.removeVideo', { detail: { video: this.props } }));
    }
  },
  render: function () {
    return (
      <div>
        <div className="playlist-item">
          <button className="btn btn-secondary btn-sm remove"
                  onClick={this.remove}
                  title="Remove this video"
                  disabled>&times;</button>
          <h5>
            <a onClick={this.raise} title={this.props.title}>
              {this.props.title}
            </a>
          </h5>
          <h6>{this.props.channel}</h6>
        </div>
        <hr />
      </div>
    );
  }
});

const Playlist = React.createClass({
  render: function () {
    let videos = [];
    for (var index in this.props.videos) {
      videos.push(
        <PlaylistItem
          key={this.props.videos[index].id}
          id={this.props.videos[index].id}
          thumbnail={this.props.videos[index].thumbnail}
          title={this.props.videos[index].title}
          channel={this.props.videos[index].channel} />
        );
    }

    return (
      <div id="playlist">
        {videos}
      </div>
    );
  }
});

const CurrentPlaylist = React.createClass({
  getInitialState: function () {
    return { videos: [] };
  },
  componentDidMount: function () {
    // ToDo - retrieve playlist from backend

    window.addEventListener('playlist.addVideo', this.addVideo);
    window.addEventListener('playlist.cueVideo', this.cueVideo);
    window.addEventListener('playlist.removeVideo', this.removeVideo);
    window.addEventListener('playlist.raiseVideo', this.raiseVideo);
  },
  componentWillUnmount: function () {
    window.removeEventListener('playlist.addVideo', this.addVideo, false);
    window.removeEventListener('playlist.cueVideo', this.cueVideo, false);
    window.removeEventListener('playlist.removeVideo', this.removeVideo, false);
    window.removeEventListener('playlist.raiseVideo', this.raiseVideo, false);
  },
  addVideo: function (event) {
    // Add the video in first position if no video playing
    // Else add it in second position

    let video = this.normalizeVideo(event.detail.video);

    if (this.isInPlaylist(video))
      return;

    this.setState(state => {
      if (isPlaylistPlaying) {
        state.videos.splice(1, 0, video);
      } else {
        state.videos.splice(0, 0, video);
      }

      return state;
    });
  },
  cueVideo: function (event) {
    // Add the video in last position
    let video = this.normalizeVideo(event.detail.video);

    if (this.isInPlaylist(video))
      return;

    this.setState(state => {
      state.videos.push(video);

      return state;
    });
  },
  removeVideo: function (event) {
    let video = this.normalizeVideo(event.detail.video);

    if (!this.isInPlaylist(video))
      return;

    this.setState(state => {
      state.videos = _.reject(state.videos, video);

      return state;
    });
  },
  raiseVideo: function (event) {
    let video = this.normalizeVideo(event.detail.video);

    if (!this.isInPlaylist(video))
      return;

    this.setState(state => {
      state.videos = _.reject(state.videos, video);
      if (isPlaylistPlaying) {
        state.videos.splice(1, 0, video);
      } else {
        state.videos.splice(0, 0, video);
      }

      return state;
    });
  },
  normalizeVideo: function (video) {
    if (_.isObject(video))
      return video;

    return { id: video };
  },
  isInPlaylist: function (video) {
    return _.some(this.state.videos, video);
  },
  render: function () {
    return (
      <div id="current-playlist">
        <Playlist videos={ this.state.videos } />
        <Player playlist={ _.map(this.state.videos, 'id') } />
      </div>
    );
  }
});

module.exports = CurrentPlaylist;