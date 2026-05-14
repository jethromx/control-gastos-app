import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProfileRow = Record<string, any>;

function mapUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email ?? '',
    fullName: row.full_name,
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseUserRepository implements UserRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: SupabaseClient<any>) {}

  async findById(id: string): Promise<User | null> {
    const { data } = await this.supabase.from('profiles').select('*').eq('id', id).single();
    return data ? mapUser(data) : null;
  }

  async findByEmail(_email: string): Promise<User | null> {
    return null; // email is in auth.users, not profiles
  }

  async findAll(): Promise<User[]> {
    const { data } = await this.supabase.from('profiles').select('*').order('created_at');
    return (data ?? []).map((r) => mapUser(r));
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert({ id: user.id, full_name: user.fullName, role: user.role, avatar_url: user.avatarUrl })
      .select()
      .single();
    if (error) throw error;
    return mapUser(data);
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    const updateData: Record<string, unknown> = {};
    if (user.fullName) updateData.full_name = user.fullName;
    if (user.role) updateData.role = user.role;
    if (user.avatarUrl !== undefined) updateData.avatar_url = user.avatarUrl;
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data);
  }

  async delete(id: string): Promise<void> {
    await this.supabase.from('profiles').delete().eq('id', id);
  }
}
