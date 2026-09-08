import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, PropertyType } from '@prisma/client';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyResponseDto } from './dto/property-response.dto';
import { PropertyListResponseDto } from './dto/property-list-response.dto';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('properties')
@ApiBearerAuth()
@Controller({ path: 'properties', version: '1' })
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new property (HOST or ADMIN)' })
  @ApiResponse({ status: 201, type: PropertyResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async create(
    @CurrentUser() host: AuthenticatedUser,
    @Body() dto: CreatePropertyDto,
  ): Promise<PropertyResponseDto> {
    return this.propertyService.create(host, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all ACTIVE properties (public, paginated, filterable)' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page (default: 10, max: 50)' })
  @ApiQuery({ name: 'city', type: String, required: false, description: 'Filter by city (case-insensitive)' })
  @ApiQuery({ name: 'country', type: String, required: false, description: 'Filter by country (case-insensitive)' })
  @ApiQuery({ name: 'propertyType', enum: PropertyType, required: false, description: 'Filter by property type' })
  @ApiQuery({ name: 'minPrice', type: Number, required: false, description: 'Minimum price per night (>= 0)' })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false, description: 'Maximum price per night (>= 0)' })
  @ApiQuery({ name: 'minGuests', type: Number, required: false, description: 'Minimum guest capacity (>= 1)' })
  @ApiQuery({ name: 'minBedrooms', type: Number, required: false, description: 'Minimum bedrooms (>= 0)' })
  @ApiQuery({ name: 'amenityIds', type: [String], required: false, description: 'Amenity IDs (AND semantics)' })
  @ApiQuery({ name: 'sort', enum: ['newest', 'oldest', 'price_asc', 'price_desc'], required: false, description: 'Sort order (default: newest)' })
  @ApiResponse({ status: 200, type: PropertyListResponseDto })
  async findAll(
    @Query() query: FindPropertiesQueryDto,
  ): Promise<PropertyListResponseDto> {
    return this.propertyService.findAll(query);
  }

  @Get('mine')
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @ApiOperation({ summary: 'List properties owned by the authenticated host (all statuses)' })
  @ApiResponse({ status: 200, type: [PropertyResponseDto] })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async findMine(
    @CurrentUser() host: AuthenticatedUser,
  ): Promise<PropertyResponseDto[]> {
    return this.propertyService.findMine(host);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get a property by ID (public can view ACTIVE; host/admin can view all)',
  })
  @ApiResponse({ status: 200, type: PropertyResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found or not accessible' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PropertyResponseDto> {
    return this.propertyService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a property (HOST owner or ADMIN only)' })
  @ApiResponse({ status: 200, type: PropertyResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Not the owner and not an admin' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async update(
    @CurrentUser() host: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ): Promise<PropertyResponseDto> {
    return this.propertyService.update(host, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a property (HOST owner or ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Property archived' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Not the owner and not an admin' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async remove(
    @CurrentUser() host: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.propertyService.remove(host, id);
  }
}
