import { Component } from '@angular/core';
import { IonicPage, NavController, ViewController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-item-create',
  templateUrl: 'item-create.html'
})
export class ItemCreatePage {

  item: any;

  Users;
  group = {
    name: '',
    users: [],
    type: "Multi"
  };

  constructor(public navCtrl: NavController, params: NavParams, public viewCtrl: ViewController) {

    this.Users = params.get('Users');

  }

  ionViewDidLoad() {

  }

  addUser(item) {
    let exist = -1;
    this.group.users.forEach((user, index) => {
      if (user._id == item._id) {
        exist = index;
      }
    })
    console.log(exist);
    if (exist == -1) {
      this.group.users.push(item);
    }
  }

  removeUser(item) {
    this.group.users.forEach((member, index) => {
      if (member._id == item._id) {
        this.group.users.splice(index, 1);
      }
    })
  }

  /**
   * The user cancelled, so we dismiss without sending data back.
   */
  cancel() {
    this.viewCtrl.dismiss();
  }

  /**
   * The user is done and wants to create the item, so return it
   * back to the presenter.
   */
  done() {
    this.viewCtrl.dismiss(this.group);
  }
}
