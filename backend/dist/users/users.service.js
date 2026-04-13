"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async create(userData) {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }
    async findAll() {
        return this.usersRepository.find({
            select: ['id', 'name', 'lastName1', 'lastName2', 'email', 'role'],
        });
    }
    async findById(id) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`Usuario ${id} no encontrado`);
        return user;
    }
    async updateRole(id, role) {
        const user = await this.findById(id);
        user.role = role;
        return this.usersRepository.save(user);
    }
    async remove(id) {
        const user = await this.findById(id);
        await this.usersRepository.remove(user);
        return { message: `Usuario ${id} eliminado correctamente` };
    }
    async updateResetToken(id, token, expires) {
        await this.usersRepository.update(id, {
            resetPasswordToken: token,
            resetPasswordExpires: expires,
        });
    }
    async findByResetToken(token) {
        return this.usersRepository.findOne({
            where: { resetPasswordToken: token },
        });
    }
    async updatePassword(id, hashedPassword) {
        await this.usersRepository.update(id, {
            passwordHash: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map