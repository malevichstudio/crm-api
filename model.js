'use strict';

import * as Sequelize from "sequelize";
import * as crypt from "password-hash";
import * as config from "../config/config";
import * as jwt from "jsonwebtoken";

const statusNotActive = 0;
const statusActive = 1;
const statusBanned = 2;

export default class User extends Sequelize.Model {
    static get statusNotActive() {
        return statusNotActive;
    }

    static get statusActive() {
        return statusActive;
    }

    static get statusBanned() {
        return statusBanned;
    }


    static init(sequelize, DataTypes) {
        return super.init(
            {
                email: {
                    type: DataTypes.STRING,
                    unique: true,
                    validate: {
                        isEmail: true,
                    },
                    allowNull: false,
                },
                phone: {
                    type: DataTypes.STRING,
                    unique: true
                },
                skype: {
                    type: DataTypes.STRING,
                    unique: true
                },
                authKey: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                sex: DataTypes.INTEGER,
                firstName: DataTypes.STRING,
                middleName: DataTypes.STRING,
                lastName: DataTypes.STRING,
                avatar: DataTypes.STRING,
                birthday: DataTypes.DATE,
                passwordHash: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                status: {
                    type: DataTypes.ENUM(this.statusNotActive, this.statusActive, this.statusBanned),
                    allowNull: false,
                },
            }, {sequelize}
        );
    }

    static associate(models) {
        this.hasMany(models.Order);
        this.belongsTo(models.Role);
    }

    static findIdentity(id) {
        return this.findOne({
            where: {
                id,
                status: this.statusActive,
            }
        }).then(user => user);
    }

    static findByEmail(email) {
        return this.findOne({
            where: {
                email,
                status: this.statusActive,
            }
        });
    }

    async setPassword(password) {
        this.passwordHash = crypt.generate(password, {saltLength: 13});
        return this;
    };

    async validatePassword(password) {
        return crypt.verify(password, this.passwordHash);
    };

    updateRole(models, roleId, options) {
        return models.Role.findByPk(roleId)
            .then(role => this.setRole(role, options));
    };

    static getUserByToken = (models, token) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, config.authorizationTokenSecret, async (error, authKey) => {
                if (error) {
                    return resolve(null);
                }
                const user = await models.User.findOne({
                    where: {
                        status: models.User.statusActive,
                        authKey: authKey.data,
                    },
                });

                if (!user) {
                    return resolve(null);
                }

                return resolve(user.dataValues)
            })
        });
    };

    login = () => (
        jwt.sign({data: this.authKey}, config.authorizationTokenSecret, {
            expiresIn: config.authorizationTokenExpire,
        })
    );
}
