import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IPostupci } from '../postupci.model';
import { PostupciService } from '../service/postupci.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './postupci-delete-dialog.component.html',
})
export class PostupciDeleteDialogComponent {
  postupci?: IPostupci;

  constructor(protected postupciService: PostupciService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.postupciService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
