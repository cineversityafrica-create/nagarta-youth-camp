-- AddColumn motherName, motherAddress, motherPhone, motherEmail, motherEmergencyContact
ALTER TABLE "registrations" ADD COLUMN "motherName" TEXT,
ADD COLUMN "motherAddress" TEXT,
ADD COLUMN "motherPhone" TEXT,
ADD COLUMN "motherEmail" TEXT,
ADD COLUMN "motherEmergencyContact" TEXT;

-- AddColumn fatherName, fatherAddress, fatherPhone, fatherEmail, fatherEmergencyContact
ALTER TABLE "registrations" ADD COLUMN "fatherName" TEXT,
ADD COLUMN "fatherAddress" TEXT,
ADD COLUMN "fatherPhone" TEXT,
ADD COLUMN "fatherEmail" TEXT,
ADD COLUMN "fatherEmergencyContact" TEXT;
