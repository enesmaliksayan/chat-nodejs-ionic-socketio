import { Component } from '@angular/core';
import { IonicPage, ModalController, NavController, NavParams } from 'ionic-angular';

import { Socket } from '../../providers/providers';
import { User } from '../../providers/providers';

@IonicPage()
@Component({
  selector: 'page-list-master',
  templateUrl: 'list-master.html'
})
export class ListMasterPage {
  Group: any = [];
  Users: any = [];
  connectionG;
  connectionU;
  lobby: any = [];

  userData;

  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController, private socket: Socket) {
    this.socket.connect();
  }

  /**
   * The view loaded, let's query our items for the list
   */
  ionViewDidLoad() {
    this.connectionG = this.socket.getGroups().subscribe((res: Array<{}>) => {
      this.Group = [];
      this.lobby = [];
      res.forEach(resp => {
        console.log(resp['type'] == 'Multi');
        if (resp['type'] == 'Multi') {
          this.Group.push(resp);
        } else if (resp['type'] == 'Lobby') {
          this.lobby.push(resp);
        }
      })
    });
    this.connectionU = this.socket.getUsers().subscribe(res => {
      this.Users = res;
    })
  }

  openItem(item) {
    this.navCtrl.push('ItemDetailPage', {
      item: item
    });
  }

  createGroup() {
    let addModal = this.modalCtrl.create('ItemCreatePage', { Users: this.Users });
    addModal.onDidDismiss(item => {
      if (item) {
        console.log(item);
        this.socket.createMultiUserGroup(item);
      }
    })
    addModal.present();
  }

  createP2P(user) {
    this.socket.createPrivateGroup(user).subscribe(res => {
      if (res['group']) {
        console.log(res['group']);
        this.openItem(res['group']);
      }
      else {
        this.openItem(res);
      }
    })
  }

}
