-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы пользователей
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage users" ON users
FOR ALL USING (auth.role() = 'admin');

-- Политики для документов
CREATE POLICY "Public documents are visible" ON documents
FOR SELECT USING (is_public = true);

CREATE POLICY "Members can view all documents" ON documents
FOR SELECT USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('member', 'admin')
));

-- Политики для сообщений чата
CREATE POLICY "Users can manage their messages" ON chat_messages
FOR ALL USING (user_id = auth.uid());

-- Политики для тикетов поддержки
CREATE POLICY "Users can create tickets" ON support_tickets
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets" ON support_tickets
FOR SELECT USING (auth.role() = 'admin');
