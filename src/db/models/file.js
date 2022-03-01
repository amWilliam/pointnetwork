const Model = require('../model');
const Sequelize = require('sequelize');

export const FILE_DOWNLOAD_STATUS = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
};

export const FILE_UPLOAD_STATUS = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
};

class File extends Model {
    constructor(...args) {
        super(...args);
    }
}

File.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        original_path: {type: Sequelize.DataTypes.TEXT},
        size: {type: Sequelize.DataTypes.INTEGER, allowNull: true},
        dl_status: {
            type: Sequelize.DataTypes.STRING,
            defaultValue: FILE_DOWNLOAD_STATUS.NOT_STARTED
        },
        ul_status: {
            type: Sequelize.DataTypes.STRING,
            defaultValue: FILE_UPLOAD_STATUS.NOT_STARTED
        },
        expires: {type: Sequelize.DataTypes.BIGINT, allowNull: true},

        // TODO: not used, remove
        chunkIds: {type: Sequelize.DataTypes.JSON, allowNull: true},
        redundancy: {type: Sequelize.DataTypes.INTEGER, allowNull: true},
        autorenew: {type: Sequelize.DataTypes.BOOLEAN, allowNull: true}
    },
    {
        indexes: [
            {fields: ['ul_status']}, // TODO: remove
            {fields: ['dl_status']}
        ]
    }
);

export default File;
