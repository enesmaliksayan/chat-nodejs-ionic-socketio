import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';
import { Api } from '../api/api';
import { User } from '../user/user';

/**
 * Socket connection provider.
 */
@Injectable()
export class Socket {
  //url: string = 'http://localhost:3000/';
  url: string = 'https://socketwhats.herokuapp.com/';
  socket;

  constructor(public http: HttpClient, public api: Api, public user: User) {
  }

  connect() {
    this.socket = io(this.url, {
      query: {
        userName: this.user._user.userName
      }
    });
    this.socket.emit('getGroups', { ok: true });
  }

  getGroups() {
    let observable = new Observable((observe: any) => {
      this.socket.on('getGroups', group => {
        console.log(group);
        observe.next(group);
      });
      return () => {
        this.socket.disconnect();
      }
    })
    return observable;
  }
  getUsers() {
    let observable = new Observable((observe: any) => {
      this.socket.on('getUsers', users => {
        observe.next(users);
      });
      return () => {
        this.socket.disconnect();
      }
    })
    return observable;
  }

  sendMessage(message: any, id, type) {
    this.socket.emit('NMTGFC', {
      type,
      sender: this.user._user.userName,
      message,
      id
    });
  }

  joinRoom(id, type) {
    this.socket.emit('join', id, type);
  }

  leaveRoom(id) {
    this.socket.emit('leave', id);
  }

  getMessages() {
    let observable = new Observable((observer: any) => {
      this.socket.on('NMTGFS', (data: any) => {
        console.log("ddsads", data);
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      }
    })
    return observable;
  }

  createMultiUserGroup(group) {
    group.users.push(this.user._user);
    this.api.post('createGroup', group).subscribe(res => {
      this.socket.emit('newGroup', group);
    })
  }

  createPrivateGroup(user) {
    let userIds;
    if (this.user._user.id >= user._id) {
      userIds = this.user._user.id + '' + user._id;
    } else {
      userIds = user._id + '' + this.user._user.id;
    }
    let group = {
      name: 'Özel Sohbet',
      users: [{ userName: this.user._user.userName }, { userName: user.userName }],
      type: 'P2P',
      userIds,
      messages: []
    }
    return this.api.post('createGroup', group).map(res => {
      if (res['userIds']) {
        console.log("1");
        return res;
      } else {
        console.log("2");
        return group;
      }
    });
  }


}
