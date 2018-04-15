import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { User } from '../../providers/providers';
import { Socket } from '../../providers/providers';

@IonicPage()
@Component({
  selector: 'page-item-detail',
  templateUrl: 'item-detail.html'
})
export class ItemDetailPage {
  chat: any;
  me;
  messages = [];
  message = '';


  constructor(public navCtrl: NavController, navParams: NavParams, public socket: Socket, user: User) {
    this.me = user._user;
    this.chat = navParams.get('item');
    console.log(this.chat);
    if (this.chat.type != 'P2P') {
      this.socket.joinRoom(this.chat._id, this.chat.type);
    } else {
      this.socket.joinRoom(this.chat.userIds, this.chat.type);
    }

    socket.getMessages().subscribe((message: Array<any>) => {

      if (message['messages'] && this.messages.length == 0) {
        message['messages'].forEach(message => {
          this.messages.push(message);
        })
      } else {
        this.messages.push(message);
      }
    })
  }

  sendMessage() {
    if (this.chat._id) {
      this.socket.sendMessage(this.message, this.chat._id, this.chat.type);
    } else {
      this.socket.sendMessage(this.message, this.chat.userIds, this.chat.type);
    }
    this.message = '';
  }

  ionViewWillLeave() {
    if (this.chat._id) {
      this.socket.leaveRoom(this.chat._id);
    }
    else {
      this.socket.leaveRoom(this.chat.userIds);
    }
  }

}
