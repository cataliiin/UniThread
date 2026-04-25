import enum


class CommunityType(str, enum.Enum):
    public = "public"    # any registered student can join directly
    request = "request"  # user submits a join request; admin approves or rejects
    invite = "invite"    # access only via invite link or direct admin nomination


class MemberStatus(str, enum.Enum):
    pending = "pending"   # join request submitted, waiting for admin decision (type='request' only)
    approved = "approved"  # active member with full access
    # Ban is NOT a status — a banned user is deleted from community_members.


class InvitationStatus(str, enum.Enum):
    pending = "pending"   # invitation sent, user has not responded
    accepted = "accepted"  # user accepted → inserted as approved member
    declined = "declined"  # user declined
