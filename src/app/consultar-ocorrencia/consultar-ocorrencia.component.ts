import { Component, OnInit, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import {FormGroup, FormBuilder, Validators, AbstractControl, FormControl} from '@angular/forms';
import { OcorrenciasService } from '../shared/services/ocorrencias.service';
import {Ocorrencia} from '../shared/models/ocorrencia.model';
import { DataTableDirective } from 'angular-datatables';
import {SelectComponent} from '../shared/select/select.component';
import {SelectOption} from '../shared/select/select-option.model';

import { Subject } from 'rxjs/Subject';
import {EdicaoOcorrenciaComponent} from '../edicao-ocorrencia/edicao-ocorrencia.component';


import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'cav-consultar-ocorrencia',
  templateUrl: './consultar-ocorrencia.component.html',
})
export class ConsultarOcorrenciaComponent implements OnInit, AfterViewInit {

  modalRef: BsModalRef;

  @ViewChild('dpselect') dpSelect: SelectComponent;
  @ViewChild('tipoocorrenciaselect') tipoSelect: SelectComponent;
  @ViewChild('situacaoselect') situacaoSelect: SelectComponent;

  // DataTable properties
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  // Component Properties
  ocorrencias = [];
  searched = false;

  config = {
  class: 'modal-lg'
  };

  dpOptions: SelectOption[] = [ ];

  ocorrenciaOptions: SelectOption[] = [ ];

  situacaoOptions: SelectOption[] = [
    {option: 'Todos', value: ''},
    {option: 'PENDENTE', value: 'PENDENTE'},
    {option: 'CONCLUIDA', value: 'CONCLUIDA'},
  ];

  searchForm: FormGroup;


  constructor(private ocorrenciasService: OcorrenciasService, private modalService: BsModalService, private formBuilder: FormBuilder) { }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  openModalWithComponent(ocorrencia: Ocorrencia) {
  this.modalRef = this.modalService.show(EdicaoOcorrenciaComponent, this.config);
  this.modalRef.content.editMode = true;
  this.modalRef.content.initializeInEditMode(ocorrencia);
}

  ngOnInit() {
    this.searchForm = this.formBuilder.group({
      local: this.formBuilder.control(''),
      placa: this.formBuilder.control(''),
      chassis: this.formBuilder.control(''),
      numeroMotor: this.formBuilder.control(''),
      nomeProp: this.formBuilder.control(''),
      numeroOcorrencia: this.formBuilder.control(''),
      dp: this.formBuilder.control(''),
      tipoOcorrencia: this.formBuilder.control(''),
      dataInicial: this.formBuilder.control(''),
      dataFinal: this.formBuilder.control(''),
      situacao: this.formBuilder.control('')
    });
    this.ocorrenciasService.getAllDps().subscribe(dps => {
      this.dpOptions.push(new SelectOption('Todos', ''));
      dps.map(dp => {
        this.dpOptions.push(new SelectOption(dp.nome, dp.id));
      });
      this.dpSelect.setValue('');
      this.situacaoSelect.setValue('');
    });
    this.ocorrenciasService.getAllTipos().subscribe(tipos => {
      this.ocorrenciaOptions.push(new SelectOption('Todos', ''));
      tipos.map(tipo => {
        this.ocorrenciaOptions.push(new SelectOption(tipo.descricao, tipo.id));
      });
      this.tipoSelect.setValue('');
    });

  }

  ngAfterViewInit() {
    this.dtTrigger.next();
  }

  pesquisarOcorrencias(values) {
    console.log(values);
    const local = values.local;
    const placa = values.placa;
    const chassis = values.chassis;
    const numeroMotor = values.numeroMotor;
    const nomeProp = values.nomeProp;
    const numeroOcorrencia = values.numeroOcorrencia;
    const dp_id = values.dp;
    const tipoOcorrencia = values.tipoOcorrencia;
    const dataInicial = values.dataInicial;
    const dataFinal = values.dataFinal;
    const situacao = values.situacao;

   this.ocorrenciasService.ocorrencias(
    local,
    placa,
    chassis,
    numeroMotor,
    nomeProp,
    numeroOcorrencia,
    dp_id,
    tipoOcorrencia,
    dataInicial,
    dataFinal,
    situacao)
      .subscribe(result => {
      if (!this.searched) {
          this.searched = true;
        }
      console.log(result);
      this.ocorrencias = result;
      this.rerender();
    }
   );
  }

  concluirOcorrencia(ocorrencia, action: string) {
    this.ocorrenciasService.ocorrenciasById(ocorrencia.id).subscribe(result => {
      console.log(result);
      result.situacao = action === 'C' ? 'CONCLUIDA' : 'PENDENTE';
      result.dp_id = result.dp.id;
      result.veiculo_id = result.veiculo.id;
      result.tipo_id = result.tipo.id;
      this.ocorrenciasService.updateOcorrencia(result).subscribe(response => {
        this.ocorrencias[this.ocorrencias.indexOf(ocorrencia)] = result;
        this.rerender();

      });
    });
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }

}
