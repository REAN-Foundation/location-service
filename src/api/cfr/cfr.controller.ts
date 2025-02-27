import { Request, Response } from 'express';
import fs from 'fs';
import { ResponseHandler } from '../../common/response.handler';
import { ApiError } from '../../common/api.error';
import { CFRValidator } from './cfr.validator';
import { CFRService } from '../../services/cfr.service';
import { container } from 'tsyringe';
import { ConfigurationManager } from '../../config/configuration.manager';
import path from 'path';
import ExcelJS from 'exceljs';
import { AmbulanceCreateModel, CFRCreateModel } from '../../domain.types/cfr/cfr.domain.types';
import { Logger } from '../../common/logger';
import { AmbulanceDto, CFRDto } from '../../domain.types/cfr/cfr.dto';

///////////////////////////////////////////////////////////////////////////////////////

export class CFRController {

    //#region member variables and constructors

    _service: CFRService = container.resolve(CFRService);

    _validator = new CFRValidator();

    //#endregion

    //#region Action methods

    getNearestCFRs = async (request: Request, response: Response): Promise<void> => {
        try {
            const tenantId = await this._validator.validateTenantId(request.params.tenantId);
            const filters = await this._validator.validateNearestCFRsRequest(request.query);
            const searchResults = await this._service.getNearestCFRs(filters, tenantId);
            ResponseHandler.success(request, response, 'Nearest CFR retrieved successfully!', 200, {
            CFR : searchResults
        });
        } catch (error: any) {
            console.error('Error fetching CFRs:', error);
            ResponseHandler.handleError(request, response, error);
        }
      };

      getNearestAmbulances = async (request: Request, response: Response): Promise<void> => {
        try {
            const tenantId = await this._validator.validateTenantId(request.params.tenantId);
            const filters = await this._validator.validateNearestAmbulancesRequest(request.query);
            const searchResults = await this._service.getNearestAmbulances(filters, tenantId);
            ResponseHandler.success(request, response, 'Nearest ambulances retrieved successfully!', 200, {
            CFR : searchResults
        });
        } catch (error: any) {
            console.error('Error fetching ambulances:', error);
            ResponseHandler.handleError(request, response, error);
        }
      };

      uploadCFRs = async (request: Request, response: Response): Promise<void> => {
        try {
        const tenantId = await this._validator.validateTenantId(request.params.tenantId);
        const normalizedPath = this.validateUploadedFile(request);
        const worksheet = await this.readExcelFile(normalizedPath);
        const rows: CFRCreateModel[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            const rowData: CFRCreateModel = {
                TenantId: tenantId,
                Name: row.getCell(1).value ? String(row.getCell(1).value) : undefined,
                Address: row.getCell(2).value ? String(row.getCell(2).value) : undefined,
                Latitude: row.getCell(3).value ? Number(row.getCell(3).value) : undefined,
                Longitude: row.getCell(4).value ? Number(row.getCell(4).value) : undefined,
                PhoneNumber: row.getCell(5).value ? String(row.getCell(5).value) : undefined,
            };
            rows.push(rowData);
          }
        });

        if (rows.length > 0) {
            const deletedRowCount = await this._service.deleteCFRsByTenantId(tenantId);
            Logger.instance().log(`Deleted ${deletedRowCount} existing CFRs`);
        }
      
        const cfrs: CFRDto[] = [];
        for (const row of rows) {
            let domainModel: CFRCreateModel = null;
            try {
                domainModel = await this._validator.validateCreateRequest(row);
                const cfr = await this._service.createCFR(domainModel);
                if (!cfr) {
                    Logger.instance().log(`Error creating CFR: ${JSON.stringify(row, null, 2)}`);
                    continue;
                }
                cfrs.push(cfr);
            } catch (error) {
                Logger.instance().log(`Error creating CFR: ${JSON.stringify(row, null, 2)}`);
            }

        }
        ResponseHandler.success(request, response, 'CFR uploaded successfully!', 201, {
            CFRs : cfrs,
        });
       } catch (error: any) {
            console.error('Error fetching CFRs:', error);
            ResponseHandler.handleError(request, response, error);
        }
      }

      uploadAmbulances = async (request: Request, response: Response): Promise<void> => {
        try {
        const tenantId = await this._validator.validateTenantId(request.params.tenantId);
        const normalizedPath = this.validateUploadedFile(request);
        const worksheet = await this.readExcelFile(normalizedPath);
        const rows: AmbulanceCreateModel[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            const rowData: CFRCreateModel = {
                TenantId: tenantId,
                Name: row.getCell(1).value ? String(row.getCell(1).value) : undefined,
                Address: row.getCell(2).value ? String(row.getCell(2).value) : undefined,
                Latitude: row.getCell(3).value ? Number(row.getCell(3).value) : undefined,
                Longitude: row.getCell(4).value ? Number(row.getCell(4).value) : undefined,
                PhoneNumber: row.getCell(5).value ? String(row.getCell(5).value) : undefined,
            };
            rows.push(rowData);
          }
        });
       
        if (rows.length > 0) {
            const deletedRowCount = await this._service.deleteAmbulancesByTenantId(tenantId);
            Logger.instance().log(`Deleted ${deletedRowCount} existing ambulances`);
        }

        const ambulances: AmbulanceDto[] = [];
        for (const row of rows) {
            let domainModel: AmbulanceCreateModel = null;
            try {
                domainModel = await this._validator.validateCreateRequest(row);
                const ambulance = await this._service.createAmbulance(domainModel);
                if (!ambulance) {
                    Logger.instance().log(`Error creating ambulance: ${JSON.stringify(row, null, 2)}`);
                    continue;
                }
                ambulances.push(ambulance);
            } catch (error) {
                Logger.instance().log(`Error creating ambulance: ${JSON.stringify(row, null, 2)}`);
            }

        }
        ResponseHandler.success(request, response, 'Ambulance uploaded successfully!', 201, {
            Ambulance : ambulances,
        });
       } catch (error: any) {
            console.error('Error fetching ambulance:', error);
            ResponseHandler.handleError(request, response, error);
        }
      }

      private validateUploadedFile = (request: Request): string => {
        const uploadedFilePath = request.file?.path;
        if (!uploadedFilePath) {
            throw new ApiError(422, 'Cannot find valid file to import!');
        }

        const fileExtension = path.extname(uploadedFilePath).toLowerCase();
        if (fileExtension !== '.xls' && fileExtension !== '.xlsx') {
            throw new ApiError(422, 'Invalid file type! Only .xls and .xlsx files are allowed.');
        }

        const UPLOAD_FOLDER = ConfigurationManager.UploadTemporaryFolder();
        const normalizedPath = path.resolve(UPLOAD_FOLDER, uploadedFilePath);

        if (!normalizedPath.startsWith(UPLOAD_FOLDER)) {
            throw new ApiError(422, 'Cannot find valid file to import!');
        }

        if (!fs.existsSync(normalizedPath)) {
            throw new ApiError(422, 'File not found!');
        }

        return normalizedPath;
      }

      private readExcelFile = async (filePath: string): Promise<ExcelJS.Worksheet> => {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0]; 
        return worksheet;
      }

    //#endregion

}
