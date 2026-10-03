import mongoose, { Document, Model, Schema, Types } from "mongoose"
import jwt from "jsonwebtoken"

import { getJwtSecretSync } from "../config.js"

export interface AccessEntry {
  service?: Types.ObjectId
  level: number
  name?: string
}

export interface FormattedUser {
  _id: unknown
  email: string
  firstname?: string
  lastname?: string
  admin: boolean
  access: Array<AccessEntryInput>
}

/** Structural access entry for formatting (covers DB docs and token users). */
export interface AccessEntryInput {
  service?: unknown
  level: number
  name?: string
}

export interface UserDocument extends Document {
  email: string
  firstname?: string
  lastname?: string
  passwordHash: string
  admin: boolean
  access: Array<AccessEntry>
  generateJWT(): string
}

interface UserModel extends Model<UserDocument> {
  format(user: {
    _id: unknown
    email: string
    firstname?: string
    lastname?: string
    admin: boolean
    access: Array<AccessEntryInput>
  }): FormattedUser
}

const userSchema = new Schema<UserDocument, UserModel>({
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    validate: {
      validator: (v: string) => {
        return /.{2,}@.{2,}\..{2,}/.test(v)
      },
      // NOTE: legacy key was the typo `invite` (ignored by mongoose);
      // corrected to `message` so tsc accepts the schema.
      message: (props: { value: string }) => `${props.value} is not a valid email!`
    }
  },
  firstname: String,
  lastname: String,
  passwordHash: {
    type: String,
    required: true
  },
  admin: {
    type: Boolean,
    default: false
  },
  access: [
    {
      service: {
        type: Schema.Types.ObjectId,
        ref: "Service"
      },
      level: {
        type: Number,
        required: true
      },
      name: {
        type: String
      }
    }
  ]
})

// Needs to use oldschool function syntax to access "this".
userSchema.methods.generateJWT = function generateJWT(this: UserDocument): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      firstname: this.firstname,
      lastname: this.lastname,
      admin: this.admin,
      access: this.access
    },
    getJwtSecretSync(),
    { expiresIn: "2d" }
  )
}

userSchema.statics.format = (user: {
  _id: unknown
  email: string
  firstname?: string
  lastname?: string
  admin: boolean
  access: Array<AccessEntryInput>
}): FormattedUser => {
  const { _id, email, firstname, lastname, admin, access } = user

  return {
    _id,
    email,
    firstname,
    lastname,
    admin,
    access
  }
}

const User = mongoose.model<UserDocument, UserModel>("User", userSchema)

export default User
