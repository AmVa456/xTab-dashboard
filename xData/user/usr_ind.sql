IF OBJECT_ID(N'[dbo].[usr_ind]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[usr_ind]
  (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [UserGuid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_usr_ind_UserGuid DEFAULT (NEWSEQUENTIALID()),
    [Email] NVARCHAR(255) NOT NULL,
    [DisplayName] NVARCHAR(120) NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT DF_usr_ind_IsActive DEFAULT (1),
    [LastLoginAt] DATETIME2(0) NULL,
    [CreatedAt] DATETIME2(0) NOT NULL CONSTRAINT DF_usr_ind_CreatedAt DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] DATETIME2(0) NOT NULL CONSTRAINT DF_usr_ind_UpdatedAt DEFAULT (SYSUTCDATETIME())
  );

  CREATE UNIQUE INDEX IX_usr_ind_Email ON [dbo].[usr_ind]([Email]);
END;
