import mongoose, { Document, Model, Schema } from "mongoose"

export interface ServiceDocument extends Document {
  name: string
  domain: string
  protocol: string
  serviceKey: string
}

export interface FormattedService {
  _id: unknown
  name: string
  domain: string
  protocol: string
}

interface ServiceModel extends Model<ServiceDocument> {
  format(service: { _id: unknown; name: string; domain: string; protocol: string }): FormattedService
}

const serviceSchema = new Schema<ServiceDocument, ServiceModel>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  domain: {
    // Domain of the service.
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  protocol: {
    // The protocol used to connect to the service.
    type: String,
    required: true,
    enum: ["http", "https"]
  },
  serviceKey: {
    // The users app identifies itself to the service by sending this key.
    // The service must have this key saved into its environment variables.
    // Each service has its own key so that if one services key is compromised,
    // the other services are still safe from someone using the compromised key
    // for pretending to be the users service.
    // !! This key must never be sent to any client. Use only between servers. !!
    type: String,
    required: true
  }
})

// Return service information without the serviceKey.
serviceSchema.statics.format = ({
  _id,
  name,
  domain,
  protocol
}: {
  _id: unknown
  name: string
  domain: string
  protocol: string
}): FormattedService => ({
  _id,
  name,
  domain,
  protocol
})

const Service = mongoose.model<ServiceDocument, ServiceModel>("Service", serviceSchema)

export default Service
