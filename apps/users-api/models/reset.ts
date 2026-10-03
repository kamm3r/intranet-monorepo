import mongoose, { Document, Model, Schema } from "mongoose"

export interface ResetDocument extends Document {
  email?: string
  expireAt: Date
}

export interface FormattedReset {
  _id: unknown
  email?: string
}

interface ResetModel extends Model<ResetDocument> {
  format(reset: { _id: unknown; email?: string }): FormattedReset
}

const resetSchema = new Schema<ResetDocument, ResetModel>({
  email: String,
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000)
  }
})
resetSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

resetSchema.statics.format = (reset: { _id: unknown; email?: string }): FormattedReset => {
  const { _id, email } = reset

  return {
    _id,
    email
  }
}

const Reset = mongoose.model<ResetDocument, ResetModel>("Reset", resetSchema)

export default Reset
