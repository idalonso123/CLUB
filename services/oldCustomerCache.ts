import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface OldCustomer {
  tarjeta_cliente: string;
  email: string;
  telefono: string;
  puntos: number;
}

class OldCustomerCache {
  private customers: OldCustomer[] = [];
  private cardIndex: Map<string, number> = new Map();
  private emailIndex: Map<string, number> = new Map(); 
  private phoneIndex: Map<string, number> = new Map(); 
  private csvPath: string;
  private lastUpdate: number = 0;
  private updateInterval: number = 60000; 
  constructor() {
    this.csvPath = path.join(process.cwd(), 'data', 'Club ViveVerde - Clientes.csv');
    this.loadData();
  }
  private loadData() {
    try {
      const fileContent = fs.readFileSync(this.csvPath, 'utf8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ';'
      });
      this.customers = [];
      this.cardIndex.clear();
      this.emailIndex.clear();
      this.phoneIndex.clear();
      records.forEach((record: any, index: number) => {
        const customer: OldCustomer = {
          tarjeta_cliente: record.tarjeta_cliente || '',
          email: record.email || '',
          telefono: record.telefono || '',
          puntos: parseInt(record.puntos) || 0
        };
        this.customers.push(customer);
        if (customer.tarjeta_cliente) {
          this.cardIndex.set(customer.tarjeta_cliente.toLowerCase(), index);
        }
        if (customer.email) {
          this.emailIndex.set(customer.email.toLowerCase(), index);
        }
        if (customer.telefono) {
          this.phoneIndex.set(customer.telefono, index);
        }
      });
      this.lastUpdate = Date.now();
      console.log(`Caché de clientes antiguos cargado: ${this.customers.length} registros`);
    } catch (error) {
      console.error('Error al cargar el CSV de clientes antiguos:', error);
      this.customers = [];
    }
  }
  private checkUpdate() {
    const now = Date.now();
    if (now - this.lastUpdate > this.updateInterval) {
      this.loadData();
    }
  }
  findCustomer(tarjeta_cliente?: string, email?: string, telefono?: string): OldCustomer | null {
    this.checkUpdate();
    if (tarjeta_cliente) {
      const index = this.cardIndex.get(tarjeta_cliente.toLowerCase());
      if (index !== undefined) {
        return this.customers[index];
      }
    }
    if (email) {
      const index = this.emailIndex.get(email.toLowerCase());
      if (index !== undefined) {
        return this.customers[index];
      }
    }
    if (telefono) {
      const index = this.phoneIndex.get(telefono);
      if (index !== undefined) {
        return this.customers[index];
      }
    }
    return null;
  }
  removeCustomer(tarjeta_cliente?: string, email?: string, telefono?: string): boolean {
    this.checkUpdate();
    let customerIndex = -1;
    if (tarjeta_cliente) {
      const index = this.cardIndex.get(tarjeta_cliente.toLowerCase());
      if (index !== undefined) customerIndex = index;
    }
    if (customerIndex === -1 && email) {
      const index = this.emailIndex.get(email.toLowerCase());
      if (index !== undefined) customerIndex = index;
    }
    if (customerIndex === -1 && telefono) {
      const index = this.phoneIndex.get(telefono);
      if (index !== undefined) customerIndex = index;
    }
    if (customerIndex === -1) return false;
    const customer = this.customers[customerIndex];
    if (customer.tarjeta_cliente) {
      this.cardIndex.delete(customer.tarjeta_cliente.toLowerCase());
    }
    if (customer.email) {
      this.emailIndex.delete(customer.email.toLowerCase());
    }
    if (customer.telefono) {
      this.phoneIndex.delete(customer.telefono);
    }
    this.customers.splice(customerIndex, 1);
    this.updateCSV();
    return true;
  }
  private updateCSV() {
    try {
      let csvContent = 'tarjeta_cliente;email;telefono;puntos;;;;\n';
      this.customers.forEach(customer => {
        csvContent += `${customer.tarjeta_cliente};${customer.email};${customer.telefono};${customer.puntos};;;;;\n`;
      });
      fs.writeFileSync(this.csvPath, csvContent, 'utf8');
      console.log('CSV de clientes antiguos actualizado');
    } catch (error) {
      console.error('Error al actualizar el CSV de clientes antiguos:', error);
    }
  }
  getAllCustomers(): OldCustomer[] {
    this.checkUpdate();
    return [...this.customers];
  }
}

const oldCustomerCache = new OldCustomerCache();

export default oldCustomerCache;