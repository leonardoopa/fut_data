"""cria tabelas iniciais

Revision ID: c57c1d84e1a9
Revises: 
Create Date: 2026-10-13 17:28:00.326304

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = 'c57c1d84e1a9'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('clubes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=60), nullable=False),
    sa.Column('nome_normalizado', sa.String(length=60).with_variant(mysql.VARCHAR(collation='utf8mb4_bin', length=60), 'mysql'), nullable=False),
    sa.Column('sigla', sa.CHAR(length=3), nullable=False),
    sa.Column('caixa', sa.Numeric(precision=10, scale=2), server_default='300.00', nullable=False),
    sa.Column('formacao', sa.Enum('3-1', '2-2', '2-1-1', '1-2-1', name='formacao', native_enum=False, create_constraint=True), nullable=True),
    sa.Column('criado_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.CheckConstraint('caixa >= 0', name=op.f('ck_clubes_caixa_nao_negativo')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_clubes')),
    sa.UniqueConstraint('nome_normalizado', name=op.f('uq_clubes_nome_normalizado')),
    sa.UniqueConstraint('sigla', name=op.f('uq_clubes_sigla'))
    )
    op.create_table('jogadores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=100), nullable=False),
    sa.Column('posicao', sa.Enum('GOL', 'ZAG', 'LAT', 'MEI', 'ATA', name='posicao', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('agilidade', sa.Integer(), nullable=False),
    sa.Column('idade', sa.Integer(), nullable=False),
    sa.Column('valor_base', sa.Numeric(precision=6, scale=2), nullable=False),
    sa.Column('condicao', sa.Enum('APTO', 'MAL_CONDICIONADO', 'DOENTE', name='condicao', native_enum=False, create_constraint=True, length=20), nullable=False),
    sa.Column('clube_id', sa.Integer(), nullable=True),
    sa.Column('velocidade', sa.Integer(), nullable=False),
    sa.Column('finalizacao', sa.Integer(), nullable=False),
    sa.Column('passe', sa.Integer(), nullable=False),
    sa.Column('drible', sa.Integer(), nullable=False),
    sa.Column('defesa', sa.Integer(), nullable=False),
    sa.Column('fisico', sa.Integer(), nullable=False),
    sa.Column('potencial', sa.Integer(), nullable=False),
    sa.Column('excluido_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=True),
    sa.Column('criado_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.Column('atualizado_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.CheckConstraint('agilidade BETWEEN 1 AND 100', name=op.f('ck_jogadores_agilidade_entre_1_e_100')),
    sa.CheckConstraint('defesa BETWEEN 1 AND 99', name=op.f('ck_jogadores_defesa_entre_1_e_99')),
    sa.CheckConstraint('drible BETWEEN 1 AND 99', name=op.f('ck_jogadores_drible_entre_1_e_99')),
    sa.CheckConstraint('finalizacao BETWEEN 1 AND 99', name=op.f('ck_jogadores_finalizacao_entre_1_e_99')),
    sa.CheckConstraint('fisico BETWEEN 1 AND 99', name=op.f('ck_jogadores_fisico_entre_1_e_99')),
    sa.CheckConstraint('idade BETWEEN 16 AND 45', name=op.f('ck_jogadores_idade_entre_16_e_45')),
    sa.CheckConstraint('passe BETWEEN 1 AND 99', name=op.f('ck_jogadores_passe_entre_1_e_99')),
    sa.CheckConstraint('potencial BETWEEN 1 AND 99', name=op.f('ck_jogadores_potencial_entre_1_e_99')),
    sa.CheckConstraint('valor_base >= 1', name=op.f('ck_jogadores_valor_base_minimo')),
    sa.CheckConstraint('velocidade BETWEEN 1 AND 99', name=op.f('ck_jogadores_velocidade_entre_1_e_99')),
    sa.ForeignKeyConstraint(['clube_id'], ['clubes.id'], name=op.f('fk_jogadores_clube_id_clubes')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_jogadores'))
    )
    op.create_index(op.f('ix_jogadores_clube_id'), 'jogadores', ['clube_id'], unique=False)
    op.create_table('partidas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('mandante_id', sa.Integer(), nullable=False),
    sa.Column('visitante_id', sa.Integer(), nullable=False),
    sa.Column('gols_mandante', sa.Integer(), nullable=False),
    sa.Column('gols_visitante', sa.Integer(), nullable=False),
    sa.Column('formacao_mandante', sa.Enum('3-1', '2-2', '2-1-1', '1-2-1', name='formacao_mandante', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('formacao_visitante', sa.Enum('3-1', '2-2', '2-1-1', '1-2-1', name='formacao_visitante', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('jogada_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.CheckConstraint('gols_mandante BETWEEN 0 AND 3', name=op.f('ck_partidas_gols_mandante_entre_0_e_3')),
    sa.CheckConstraint('gols_visitante BETWEEN 0 AND 3', name=op.f('ck_partidas_gols_visitante_entre_0_e_3')),
    sa.CheckConstraint('mandante_id <> visitante_id', name=op.f('ck_partidas_clubes_distintos')),
    sa.ForeignKeyConstraint(['mandante_id'], ['clubes.id'], name=op.f('fk_partidas_mandante_id_clubes')),
    sa.ForeignKeyConstraint(['visitante_id'], ['clubes.id'], name=op.f('fk_partidas_visitante_id_clubes')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_partidas'))
    )
    op.create_index(op.f('ix_partidas_mandante_id'), 'partidas', ['mandante_id'], unique=False)
    op.create_index(op.f('ix_partidas_visitante_id'), 'partidas', ['visitante_id'], unique=False)
    op.create_table('contratos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('jogador_id', sa.Integer(), nullable=False),
    sa.Column('clube_id', sa.Integer(), nullable=False),
    sa.Column('valor_compra', sa.Numeric(precision=6, scale=2), nullable=False),
    sa.Column('fidelidade_ate', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.Column('situacao', sa.Enum('ATIVO', 'ENCERRADO', 'RESCINDIDO', name='situacao', native_enum=False, create_constraint=True, length=12), nullable=False),
    sa.Column('iniciado_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.Column('encerrado_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=True),
    sa.ForeignKeyConstraint(['clube_id'], ['clubes.id'], name=op.f('fk_contratos_clube_id_clubes')),
    sa.ForeignKeyConstraint(['jogador_id'], ['jogadores.id'], name=op.f('fk_contratos_jogador_id_jogadores')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_contratos'))
    )
    op.create_index(op.f('ix_contratos_clube_id'), 'contratos', ['clube_id'], unique=False)
    op.create_index(op.f('ix_contratos_jogador_id'), 'contratos', ['jogador_id'], unique=False)
    op.create_table('duelos_partida',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('partida_id', sa.Integer(), nullable=False),
    sa.Column('ordem', sa.Integer(), nullable=False),
    sa.Column('clube_atacante_id', sa.Integer(), nullable=False),
    sa.Column('atacante_id', sa.Integer(), nullable=False),
    sa.Column('defensor_id', sa.Integer(), nullable=False),
    sa.Column('nome_atacante', sa.String(length=100), nullable=False),
    sa.Column('nome_defensor', sa.String(length=100), nullable=False),
    sa.Column('posicao_atacante', sa.Enum('GOL', 'ZAG', 'LAT', 'MEI', 'ATA', name='posicao_atacante', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('posicao_defensor', sa.Enum('GOL', 'ZAG', 'LAT', 'MEI', 'ATA', name='posicao_defensor', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('condicao_atacante', sa.Enum('APTO', 'MAL_CONDICIONADO', 'DOENTE', name='condicao_atacante', native_enum=False, create_constraint=True, length=20), nullable=False),
    sa.Column('condicao_defensor', sa.Enum('APTO', 'MAL_CONDICIONADO', 'DOENTE', name='condicao_defensor', native_enum=False, create_constraint=True, length=20), nullable=False),
    sa.Column('atributo_ataque', sa.Enum('shooting', 'passing', 'dribbling', 'defending', name='atributo_ataque', native_enum=False, create_constraint=True, length=10), nullable=False),
    sa.Column('atributo_defesa', sa.Enum('shooting', 'passing', 'dribbling', 'defending', name='atributo_defesa', native_enum=False, create_constraint=True, length=10), nullable=False),
    sa.Column('valor_ataque', sa.Integer(), nullable=False),
    sa.Column('valor_defesa', sa.Integer(), nullable=False),
    sa.Column('gol', sa.Boolean(), nullable=False),
    sa.CheckConstraint('ordem BETWEEN 1 AND 6', name=op.f('ck_duelos_partida_ordem_entre_1_e_6')),
    sa.ForeignKeyConstraint(['atacante_id'], ['jogadores.id'], name=op.f('fk_duelos_partida_atacante_id_jogadores')),
    sa.ForeignKeyConstraint(['clube_atacante_id'], ['clubes.id'], name=op.f('fk_duelos_partida_clube_atacante_id_clubes')),
    sa.ForeignKeyConstraint(['defensor_id'], ['jogadores.id'], name=op.f('fk_duelos_partida_defensor_id_jogadores')),
    sa.ForeignKeyConstraint(['partida_id'], ['partidas.id'], name=op.f('fk_duelos_partida_partida_id_partidas')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_duelos_partida')),
    sa.UniqueConstraint('partida_id', 'ordem', name=op.f('uq_duelos_partida_partida_id_ordem'))
    )
    op.create_table('escalacoes',
    sa.Column('clube_id', sa.Integer(), nullable=False),
    sa.Column('jogador_id', sa.Integer(), nullable=False),
    sa.Column('criado_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.ForeignKeyConstraint(['clube_id'], ['clubes.id'], name=op.f('fk_escalacoes_clube_id_clubes')),
    sa.ForeignKeyConstraint(['jogador_id'], ['jogadores.id'], name=op.f('fk_escalacoes_jogador_id_jogadores')),
    sa.PrimaryKeyConstraint('clube_id', 'jogador_id', name=op.f('pk_escalacoes')),
    sa.UniqueConstraint('jogador_id', name=op.f('uq_escalacoes_jogador_id'))
    )
    op.create_table('transacoes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('clube_id', sa.Integer(), nullable=False),
    sa.Column('jogador_id', sa.Integer(), nullable=False),
    sa.Column('nome_jogador', sa.String(length=100), nullable=False),
    sa.Column('tipo', sa.Enum('COMPRA', 'VENDA', name='tipo', native_enum=False, create_constraint=True), nullable=False),
    sa.Column('valor', sa.Numeric(precision=6, scale=2), nullable=False),
    sa.Column('taxa', sa.Numeric(precision=6, scale=2), nullable=False),
    sa.Column('multa', sa.Numeric(precision=6, scale=2), nullable=False),
    sa.Column('lucro', sa.Numeric(precision=7, scale=2), nullable=True),
    sa.Column('variacao_caixa', sa.Numeric(precision=8, scale=2), nullable=False),
    sa.Column('criado_em', sa.DateTime().with_variant(mysql.DATETIME(fsp=6), 'mysql'), nullable=False),
    sa.ForeignKeyConstraint(['clube_id'], ['clubes.id'], name=op.f('fk_transacoes_clube_id_clubes')),
    sa.ForeignKeyConstraint(['jogador_id'], ['jogadores.id'], name=op.f('fk_transacoes_jogador_id_jogadores')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_transacoes'))
    )
    op.create_index('ix_transacoes_clube_id_criado_em', 'transacoes', ['clube_id', 'criado_em'], unique=False)
    op.create_index(op.f('ix_transacoes_jogador_id'), 'transacoes', ['jogador_id'], unique=False)


def downgrade() -> None:
    op.drop_table('transacoes')
    op.drop_table('escalacoes')
    op.drop_table('duelos_partida')
    op.drop_table('contratos')
    op.drop_table('partidas')
    op.drop_table('jogadores')
    op.drop_table('clubes')
