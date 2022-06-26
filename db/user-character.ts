import { UserCharacter } from '../types/universalis/user';
import mariadb from 'mariadb';
import { createHash } from 'crypto';

export function getUserAuthCode(userId: string): string {
  return 'MB' + createHash('sha1').update(userId).digest('hex').substring(0, 5).toUpperCase();
}

export function createUserCharacter(character: UserCharacter, conn: mariadb.Connection) {
  return conn.execute(
    'INSERT INTO users_characters (id, user_id, lodestone_id, name, server, avatar, main, confirmed, updated) VALUE (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      character.id,
      character.userId,
      character.lodestoneId,
      character.name,
      character.server,
      character.avatar,
      character.main,
      character.confirmed,
      character.updated,
    ]
  );
}

export async function getUserCharacters(
  userId: string,
  conn: mariadb.Connection
): Promise<UserCharacter[]> {
  const rows: Record<string, any>[] = await conn.query(
    'SELECT id, user_id, lodestone_id, name, server, avatar, main, confirmed, updated FROM users_characters WHERE user_id = ?',
    [userId]
  );
  return rows.map(rowToUserCharacter);
}

function rowToUserCharacter(row: Record<string, any>): UserCharacter {
  return {
    id: row['id'],
    userId: row['user_id'],
    lodestoneId: row['lodestone_id'],
    name: row['name'],
    server: row['server'],
    avatar: row['avatar'],
    main: row['main'],
    confirmed: row['confirmed'],
    updated: row['updated'],
  };
}
